using System.Net;
using System.Text.Json;
using DemoEnglish.Application.Dictionary;
using DemoEnglish.Infrastructure.Dictionary.FreeDictionary;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DemoEnglish.Infrastructure.Dictionary;

public sealed class DictionaryLookupService : IDictionaryLookupService
{
    public const string HttpClientName = "FreeDictionary";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DictionaryLookupService> _logger;

    public DictionaryLookupService(
        IHttpClientFactory httpClientFactory,
        ILogger<DictionaryLookupService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<DictionaryLookupResult> LookupAsync(string word, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(word))
            return new DictionaryLookupResult.WordNotFound(word ?? string.Empty);

        var normalized = word.Trim();
        var client = _httpClientFactory.CreateClient(HttpClientName);
        var path = $"api/v2/entries/en/{Uri.EscapeDataString(normalized)}";

        HttpResponseMessage response;
        try
        {
            response = await client.GetAsync(path, cancellationToken).ConfigureAwait(false);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Dictionary HTTP request failed for {Word}", normalized);
            return new DictionaryLookupResult.TransientError("Unable to reach the dictionary service.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Dictionary request timed out for {Word}", normalized);
            return new DictionaryLookupResult.TransientError("The dictionary service took too long to respond.");
        }

        if (response.StatusCode == HttpStatusCode.NotFound)
            return new DictionaryLookupResult.WordNotFound(normalized);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Dictionary API returned {StatusCode} for {Word}",
                (int)response.StatusCode,
                normalized);
            return new DictionaryLookupResult.TransientError("The dictionary service returned an unexpected error.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        List<FreeDictionaryEntry>? entries;
        try
        {
            entries = await JsonSerializer.DeserializeAsync<List<FreeDictionaryEntry>>(stream, JsonOptions, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize dictionary response for {Word}", normalized);
            return new DictionaryLookupResult.TransientError("Invalid response from the dictionary service.");
        }

        if (entries is null || entries.Count == 0)
            return new DictionaryLookupResult.WordNotFound(normalized);

        var dto = WordDefinitionMapper.TryMap(entries[0]);
        if (dto is null)
            return new DictionaryLookupResult.WordNotFound(normalized);

        return new DictionaryLookupResult.Found(dto);
    }
}
