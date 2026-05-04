using System.IO.Compression;
using System.Net;
using System.Text.RegularExpressions;
using DemoEnglish.Application.Anki;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;

namespace DemoEnglish.Infrastructure.Anki;

public sealed class AnkiApkgImportReader : IAnkiApkgImportReader
{
    private const int MaxNotesImported = 10_000;
    private const char FieldSeparator = '\u001f'; // Anki unit separator between fields

    private static readonly Regex HtmlTag = new("<[^>]+>", RegexOptions.Singleline | RegexOptions.Compiled);

    /// <summary>Captures <c>src</c> from img tags so we can preserve media as <c>[img:file]</c> after stripping HTML.</summary>
    private static readonly Regex ImgTagWithSrc = new(
        """<img\b[^>]*?\bsrc\s*=\s*(['"])(.*?)\1[^>]*>""",
        RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ILogger<AnkiApkgImportReader> _logger;

    public AnkiApkgImportReader(ILogger<AnkiApkgImportReader> logger)
    {
        _logger = logger;
    }

    public async Task<AnkiImportResultDto> ReadAsync(Stream apkgStream, CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>
        {
            ".apkg: using the first field as front and remaining fields as back (HTML stripped). Cloze and custom layouts are simplified.",
        };

        await using var buffered = new MemoryStream();
        await apkgStream.CopyToAsync(buffered, cancellationToken).ConfigureAwait(false);
        if (buffered.Length == 0)
            return new AnkiImportResultDto([], ["The package is empty."]);

        buffered.Position = 0;

        var tempDir = Path.Combine(Path.GetTempPath(), "demoenglish-apkg-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(tempDir);
        string? collectionPath = null;

        try
        {
            using (var zip = new ZipArchive(buffered, ZipArchiveMode.Read, leaveOpen: true))
            {
                foreach (var entry in zip.Entries)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (string.IsNullOrEmpty(entry.Name))
                        continue;

                    var baseName = Path.GetFileName(entry.FullName.Replace('\\', '/'));
                    if (baseName.Equals("collection.anki2", StringComparison.OrdinalIgnoreCase) ||
                        baseName.Equals("collection.anki21", StringComparison.OrdinalIgnoreCase))
                    {
                        if (collectionPath is not null)
                        {
                            warnings.Add("Multiple collection database entries found; using the first one.");
                            continue;
                        }

                        collectionPath = Path.Combine(tempDir, baseName);
                        entry.ExtractToFile(collectionPath, overwrite: true);
                    }
                }
            }

            if (collectionPath is null || !File.Exists(collectionPath))
            {
                return new AnkiImportResultDto(
                    [],
                    warnings.Concat(["No collection.anki2 or collection.anki21 found inside the .apkg."]).ToList());
            }

            var cards = await ReadNotesFromCollectionAsync(collectionPath, warnings, cancellationToken)
                .ConfigureAwait(false);
            return new AnkiImportResultDto(cards, warnings);
        }
        catch (InvalidDataException ex)
        {
            _logger.LogWarning(ex, "Invalid .apkg zip");
            return new AnkiImportResultDto([], warnings.Concat(["The file is not a valid ZIP archive (.apkg)."]).ToList());
        }
        catch (SqliteException ex)
        {
            _logger.LogWarning(ex, "SQLite error reading Anki collection");
            return new AnkiImportResultDto(
                [],
                warnings.Concat([$"Could not read the Anki database: {ex.Message}"]).ToList());
        }
        finally
        {
            try
            {
                if (Directory.Exists(tempDir))
                    Directory.Delete(tempDir, recursive: true);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not delete temp apkg dir {Dir}", tempDir);
            }
        }
    }

    private static async Task<IReadOnlyList<AnkiCardDto>> ReadNotesFromCollectionAsync(
        string collectionPath,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        var cards = new List<AnkiCardDto>();
        var csb = new SqliteConnectionStringBuilder
        {
            DataSource = collectionPath,
            Mode = SqliteOpenMode.ReadOnly,
            Cache = SqliteCacheMode.Shared
        };

        await using var conn = new SqliteConnection(csb.ConnectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        if (!await TableExistsAsync(conn, "notes", cancellationToken).ConfigureAwait(false))
        {
            warnings.Add("The collection database has no 'notes' table.");
            return cards;
        }

        var total = await CountNotesAsync(conn, cancellationToken).ConfigureAwait(false);
        if (total > MaxNotesImported)
            warnings.Add($"Only the first {MaxNotesImported:N0} of {total:N0} notes were imported.");

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT flds FROM notes ORDER BY id LIMIT {MaxNotesImported}";

        var line = 0;
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            line++;
            var flds = reader.GetString(0);
            var parts = flds.Split(FieldSeparator, StringSplitOptions.None);
            if (parts.Length < 2)
            {
                warnings.Add($"Note #{line}: skipped (expected at least two fields separated by U+001F).");
                continue;
            }

            var front = StripHtml(parts[0]).Trim();
            var back = string.Join("\n", parts.Skip(1).Select(StripHtml).Select(s => s.Trim()))
                .Trim();

            if (string.IsNullOrWhiteSpace(front) && string.IsNullOrWhiteSpace(back))
                continue;

            if (string.IsNullOrWhiteSpace(front) || string.IsNullOrWhiteSpace(back))
            {
                warnings.Add($"Note #{line}: skipped (front or back empty after stripping HTML).");
                continue;
            }

            cards.Add(new AnkiCardDto(front, back, line));
        }

        if (cards.Count == 0)
            warnings.Add("No importable notes were found (need at least two non-empty fields per note).");

        return cards;
    }

    private static async Task<bool> TableExistsAsync(SqliteConnection conn, string table, CancellationToken ct)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=$name LIMIT 1;";
        cmd.Parameters.AddWithValue("$name", table);
        var o = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return o is not null;
    }

    private static async Task<int> CountNotesAsync(SqliteConnection conn, CancellationToken ct)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM notes;";
        var scalar = await cmd.ExecuteScalarAsync(ct).ConfigureAwait(false);
        return Convert.ToInt32(scalar);
    }

    public static string StripHtml(string? html)
    {
        if (string.IsNullOrEmpty(html))
            return string.Empty;

        var withImgPlaceholders = ImgTagWithSrc.Replace(
            html,
            m =>
            {
                var rawSrc = m.Groups[2].Value;
                var decoded = WebUtility.HtmlDecode(rawSrc).Trim();
                if (string.IsNullOrEmpty(decoded))
                    return " ";
                if (decoded.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    return " ";
                return " [img:" + decoded + "] ";
            });

        var withoutTags = HtmlTag.Replace(withImgPlaceholders, " ");
        return WebUtility.HtmlDecode(withoutTags).Replace('\u00a0', ' ');
    }
}
