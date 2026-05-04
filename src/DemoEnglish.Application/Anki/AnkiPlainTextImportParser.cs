namespace DemoEnglish.Application.Anki;

public sealed class AnkiPlainTextImportParser : IAnkiPlainTextImportParser
{
    private const int MaxLines = 10_000;

    public AnkiImportResultDto Parse(string content, string? fileName, CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>();
        if (string.IsNullOrWhiteSpace(content))
            return new AnkiImportResultDto([], ["File is empty."]);

        var separator = DetectSeparator(content, fileName, warnings);
        var cards = new List<AnkiCardDto>();
        var lineNumber = 0;

        using var reader = new StringReader(content);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            cancellationToken.ThrowIfCancellationRequested();
            lineNumber++;
            if (lineNumber > MaxLines)
            {
                warnings.Add($"Stopped after {MaxLines:N0} lines.");
                break;
            }

            var trimmed = line.TrimEnd('\r');
            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            if (trimmed.StartsWith('#'))
            {
                if (trimmed.StartsWith("#separator:", StringComparison.OrdinalIgnoreCase))
                    ApplySeparatorDirective(trimmed, ref separator, warnings);
                continue;
            }

            var (front, back) = SplitTwoFields(trimmed, separator);
            if (string.IsNullOrWhiteSpace(front) && string.IsNullOrWhiteSpace(back))
                continue;

            if (string.IsNullOrWhiteSpace(front) || string.IsNullOrWhiteSpace(back))
            {
                warnings.Add($"Line {lineNumber}: skipped (need two non-empty fields).");
                continue;
            }

            cards.Add(new AnkiCardDto(front.Trim(), back.Trim(), lineNumber));
        }

        if (cards.Count == 0)
            warnings.Add("No valid cards found. Use two columns: front and back (tab is the default).");

        return new AnkiImportResultDto(cards, warnings);
    }

    private static char DetectSeparator(string content, string? fileName, List<string> warnings)
    {
        var ext = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (ext == ".csv")
        {
            warnings.Add("CSV detected: using the first comma as field separator (quoted commas not supported).");
            return ',';
        }

        var firstData = FirstNonDirectiveLine(content);
        if (firstData is null)
            return '\t';

        if (firstData.Contains('\t'))
            return '\t';
        if (firstData.Contains(';'))
            return ';';
        if (ext == ".tsv")
            return '\t';

        return '\t';
    }

    private static string? FirstNonDirectiveLine(string content)
    {
        using var r = new StringReader(content);
        string? line;
        while ((line = r.ReadLine()) is not null)
        {
            var t = line.Trim();
            if (t.Length == 0 || t.StartsWith('#'))
                continue;
            return line;
        }

        return null;
    }

    private static void ApplySeparatorDirective(string line, ref char separator, List<string> warnings)
    {
        var value = line["#separator:".Length..].Trim();
        var lower = value.ToLowerInvariant();
        separator = lower switch
        {
            "tab" => '\t',
            "semicolon" or "semi colon" => ';',
            "comma" => ',',
            _ => '\t'
        };
        warnings.Add($"Using separator from file: {DescribeSeparator(separator)}.");
    }

    private static string DescribeSeparator(char c) =>
        c == '\t' ? "tab" : c.ToString();

    private static (string Front, string Back) SplitTwoFields(string line, char separator)
    {
        if (separator == ',')
        {
            var idx = line.IndexOf(',', StringComparison.Ordinal);
            if (idx < 0)
                return (line, string.Empty);
            return (line[..idx], line[(idx + 1)..]);
        }

        var parts = line.Split(separator, 2, StringSplitOptions.None);
        if (parts.Length < 2)
            return (parts[0], string.Empty);
        return (parts[0], parts[1]);
    }
}
