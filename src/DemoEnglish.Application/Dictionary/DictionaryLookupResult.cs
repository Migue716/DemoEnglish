namespace DemoEnglish.Application.Dictionary;

public abstract record DictionaryLookupResult
{
    public sealed record Found(WordDefinitionDto Definition) : DictionaryLookupResult;

    public sealed record WordNotFound(string Word) : DictionaryLookupResult;

    public sealed record TransientError(string Message) : DictionaryLookupResult;
}
