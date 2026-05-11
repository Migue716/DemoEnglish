using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace DemoEnglish.Api.Services;

public sealed class OpenAiInterviewCoach
{
    private const int MinTranscriptChars = 25;
    private const int MaxTranscriptChars = 16_000;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptionsMonitor<OpenAiOptions> _options;

    public OpenAiInterviewCoach(IHttpClientFactory httpClientFactory, IOptionsMonitor<OpenAiOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
    }

    public async Task<(bool Ok, string? Summary, ProblemDetails? Problem)> SummarizeAsync(
        string transcript,
        CancellationToken cancellationToken)
    {
        var trimmed = transcript.Trim();
        if (trimmed.Length < MinTranscriptChars)
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Transcript too short",
                    Detail = $"Provide at least {MinTranscriptChars} characters of interview text.",
                    Status = StatusCodes.Status400BadRequest,
                });
        }

        if (trimmed.Length > MaxTranscriptChars)
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Transcript too long",
                    Detail = $"Maximum length is {MaxTranscriptChars} characters.",
                    Status = StatusCodes.Status400BadRequest,
                });
        }

        var key = _options.CurrentValue.ApiKey?.Trim();
        if (string.IsNullOrEmpty(key))
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Interview summary not configured",
                    Detail =
                        "Set configuration key OpenAI:ApiKey (e.g. dotnet user-secrets set \"OpenAI:ApiKey\" \"sk-…\" from the Api project folder).",
                    Status = StatusCodes.Status503ServiceUnavailable,
                });
        }

        var model = string.IsNullOrWhiteSpace(_options.CurrentValue.ChatModel)
            ? "gpt-4o-mini"
            : _options.CurrentValue.ChatModel.Trim();

        var system =
            "You are an interview coach. The user will paste a rough live transcript of their spoken English practice. "
            + "Give concise feedback: what worked well, what to improve, and 3 specific actionable tips for their next attempt. "
            + "Keep a supportive tone. Use plain paragraphs; avoid markdown headings.";

        var payload = new
        {
            model,
            temperature = 0.35,
            messages = new object[]
            {
                new { role = "system", content = system },
                new
                {
                    role = "user",
                    content = "Interview practice transcript (may contain errors from speech recognition):\n\n" + trimmed,
                },
            },
        };

        var json = JsonSerializer.Serialize(
            payload,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var client = _httpClientFactory.CreateClient("OpenAI");
        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "OpenAI request timed out",
                    Detail = "The summary request took too long. Try a shorter transcript.",
                    Status = StatusCodes.Status504GatewayTimeout,
                });
        }
        catch (HttpRequestException ex)
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Could not reach OpenAI",
                    Detail = ex.Message,
                    Status = StatusCodes.Status502BadGateway,
                });
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            var detail = TryReadOpenAiError(body) ?? response.ReasonPhrase ?? "OpenAI returned an error.";
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "OpenAI error",
                    Detail = detail,
                    Status = StatusCodes.Status502BadGateway,
                });
        }

        string? summary;
        try
        {
            using var doc = JsonDocument.Parse(body);
            summary = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Unexpected OpenAI response",
                    Detail = ex.Message,
                    Status = StatusCodes.Status502BadGateway,
                });
        }

        summary = summary?.Trim();
        if (string.IsNullOrEmpty(summary))
        {
            return (
                false,
                null,
                new ProblemDetails
                {
                    Title = "Empty summary",
                    Detail = "The model returned no text.",
                    Status = StatusCodes.Status502BadGateway,
                });
        }

        return (true, summary, null);
    }

    private static string? TryReadOpenAiError(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error", out var err) &&
                err.TryGetProperty("message", out var msg))
            {
                return msg.GetString();
            }
        }
        catch
        {
            /* ignore */
        }

        return null;
    }
}
