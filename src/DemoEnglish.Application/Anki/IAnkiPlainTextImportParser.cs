namespace DemoEnglish.Application.Anki;

public interface IAnkiPlainTextImportParser
{
    /// <summary>Parses Anki-compatible plain text (tab, semicolon, or comma separator) or simple CSV.</summary>
    AnkiImportResultDto Parse(string content, string? fileName, CancellationToken cancellationToken = default);
}
