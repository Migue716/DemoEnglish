using System.Text.Json.Serialization;

namespace DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

public sealed class FreeDictionaryMeaning
{
    [JsonPropertyName("partOfSpeech")]
    public string? PartOfSpeech { get; init; }

    [JsonPropertyName("definitions")]
    public IReadOnlyList<FreeDictionaryDefinition>? Definitions { get; init; }
}
