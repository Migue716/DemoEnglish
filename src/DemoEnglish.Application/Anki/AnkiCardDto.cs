namespace DemoEnglish.Application.Anki;

public sealed record AnkiCardDto(string Front, string Back, int? SourceLine = null);
