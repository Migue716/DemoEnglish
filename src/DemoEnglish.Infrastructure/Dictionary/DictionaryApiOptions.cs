namespace DemoEnglish.Infrastructure.Dictionary;

public sealed class DictionaryApiOptions
{
    public const string SectionName = "DictionaryApi";

    public string BaseUrl { get; set; } = "https://api.dictionaryapi.dev/";

    public int TimeoutSeconds { get; set; } = 15;
}
