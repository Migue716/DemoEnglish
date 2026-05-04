namespace DemoEnglish.Application.Anki;

/// <summary>Reads Anki package (.apkg) files: ZIP containing SQLite collection.anki2 / collection.anki21.</summary>
public interface IAnkiApkgImportReader
{
    Task<AnkiImportResultDto> ReadAsync(Stream apkgStream, CancellationToken cancellationToken = default);
}
