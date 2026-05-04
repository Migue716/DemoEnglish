using System.Net;
using System.Text;
using DemoEnglish.Application.Dictionary;
using DemoEnglish.Infrastructure.Dictionary;
using Microsoft.Extensions.Logging.Abstractions;

namespace DemoEnglish.Tests.Dictionary;

public sealed class DictionaryLookupServiceTests
{
    [Fact]
    public async Task LookupAsync_ReturnsWordNotFound_On404()
    {
        var handler = new StubHttpMessageHandler(
            _ => new HttpResponseMessage(HttpStatusCode.NotFound));
        using var client = CreateClient(handler);
        var factory = new FixedHttpClientFactory(client);
        var sut = new DictionaryLookupService(factory, NullLogger<DictionaryLookupService>.Instance);

        var result = await sut.LookupAsync("notarealwordxyz123");

        Assert.IsType<DictionaryLookupResult.WordNotFound>(result);
    }

    [Fact]
    public async Task LookupAsync_ReturnsFound_WhenApiReturnsValidPayload()
    {
        const string json = """
            [{"word":"cache","phonetic":"/kæʃ/","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A store of things that will be required in the future."}]}]}]
            """;
        var handler = new StubHttpMessageHandler(
            _ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        using var client = CreateClient(handler);
        var factory = new FixedHttpClientFactory(client);
        var sut = new DictionaryLookupService(factory, NullLogger<DictionaryLookupService>.Instance);

        var result = await sut.LookupAsync("cache");

        var found = Assert.IsType<DictionaryLookupResult.Found>(result);
        Assert.Equal("cache", found.Definition.Word);
        Assert.Equal("/kæʃ/", found.Definition.PhoneticText);
        Assert.Contains("store of things", found.Definition.PrimaryDefinition);
    }

    private static HttpClient CreateClient(HttpMessageHandler handler) =>
        new(handler)
        {
            BaseAddress = new Uri("https://api.dictionaryapi.dev/")
        };

    private sealed class FixedHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpClient _client;

        public FixedHttpClientFactory(HttpClient client) => _client = client;

        public HttpClient CreateClient(string name) => _client;
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) =>
            _responder = responder;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(_responder(request));
    }
}
