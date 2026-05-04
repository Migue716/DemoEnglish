using System.Text.Json.Serialization;

namespace DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

public sealed class FreeDictionaryDefinition
{
    [JsonPropertyName("definition")]
    public string? Definition { get; init; }
}
