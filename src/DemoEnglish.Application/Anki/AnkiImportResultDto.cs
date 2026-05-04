namespace DemoEnglish.Application.Anki;

public sealed record AnkiImportResultDto(
    IReadOnlyList<AnkiCardDto> Cards,
    IReadOnlyList<string> Warnings);
