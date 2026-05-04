using System.IO.Compression;
using DemoEnglish.Infrastructure.Anki;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;

namespace DemoEnglish.Tests.Anki;

public sealed class AnkiApkgImportReaderTests
{
    [Fact]
    public async Task ReadAsync_MinimalApkg_ReturnsCardsWithHtmlStripped()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), "anki-test-" + Guid.NewGuid().ToString("n") + ".sqlite");
        try
        {
            await using (var setup = new SqliteConnection($"Data Source={dbPath};Pooling=False"))
            {
                await setup.OpenAsync();
                await using var cmd = setup.CreateCommand();
                cmd.CommandText = """
                    CREATE TABLE notes (id INTEGER PRIMARY KEY, flds TEXT NOT NULL);
                    INSERT INTO notes (id, flds) VALUES (1, 'Alpha' || char(31) || 'Beta');
                    INSERT INTO notes (id, flds) VALUES (2, '<div>Q</div>' || char(31) || 'A');
                    """;
                await cmd.ExecuteNonQueryAsync();
            }

            var apkgBytes = await BuildApkgAsync(dbPath);

            var sut = new AnkiApkgImportReader(NullLogger<AnkiApkgImportReader>.Instance);
            var result = await sut.ReadAsync(new MemoryStream(apkgBytes));

            Assert.Equal(2, result.Cards.Count);
            Assert.Equal("Alpha", result.Cards[0].Front);
            Assert.Equal("Beta", result.Cards[0].Back);
            Assert.Equal("Q", result.Cards[1].Front);
            Assert.Equal("A", result.Cards[1].Back);
        }
        finally
        {
            try
            {
                File.Delete(dbPath);
            }
            catch
            {
                /* temp cleanup best-effort */
            }
        }
    }

    [Fact]
    public void StripHtml_RemovesTagsAndDecodesEntities()
    {
        var t = AnkiApkgImportReader.StripHtml("<b>Hi</b>&nbsp;there");
        Assert.DoesNotContain("<", t);
        Assert.Contains("Hi", t);
        Assert.Contains("there", t);
    }

    [Fact]
    public void StripHtml_PreservesImgSrcAsPlaceholder()
    {
        var t = AnkiApkgImportReader.StripHtml("""<div><img src="word.png" alt="x" /></div> extra""");
        Assert.DoesNotContain("<", t);
        Assert.Contains("[img:word.png]", t);
        Assert.Contains("extra", t);
    }

    private static async Task<byte[]> BuildApkgAsync(string sqliteFilePath)
    {
        var dbBytes = await File.ReadAllBytesAsync(sqliteFilePath);
        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            var entry = zip.CreateEntry("collection.anki2");
            await using (var s = entry.Open())
            {
                await s.WriteAsync(dbBytes);
            }
        }

        return ms.ToArray();
    }
}
