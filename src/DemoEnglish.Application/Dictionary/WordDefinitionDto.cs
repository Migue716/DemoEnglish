namespace DemoEnglish.Application.Dictionary;

public sealed record WordDefinitionDto(
    string Word,
    string? PhoneticText,
    string? AudioUrl,
    string PrimaryDefinition,
    string? PartOfSpeech);
