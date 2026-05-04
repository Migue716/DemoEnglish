using System.Text.Json.Serialization;

namespace DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

public sealed class FreeDictionaryPhonetic
{
    [JsonPropertyName("text")]
    public string? Text { get; init; }

    [JsonPropertyName("audio")]
    public string? Audio { get; init; }
}
