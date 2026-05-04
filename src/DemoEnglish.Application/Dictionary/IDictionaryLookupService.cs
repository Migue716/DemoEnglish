namespace DemoEnglish.Application.Dictionary;

public interface IDictionaryLookupService
{
    Task<DictionaryLookupResult> LookupAsync(string word, CancellationToken cancellationToken = default);
}
