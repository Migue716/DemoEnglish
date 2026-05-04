using System.Text.Json.Serialization;

namespace DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

public sealed class FreeDictionaryEntry
{
    [JsonPropertyName("word")]
    public string? Word { get; init; }

    [JsonPropertyName("phonetic")]
    public string? Phonetic { get; init; }

    [JsonPropertyName("phonetics")]
    public IReadOnlyList<FreeDictionaryPhonetic>? Phonetics { get; init; }

    [JsonPropertyName("meanings")]
    public IReadOnlyList<FreeDictionaryMeaning>? Meanings { get; init; }
}
