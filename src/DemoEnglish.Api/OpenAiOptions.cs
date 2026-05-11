namespace DemoEnglish.Api;

/// <summary>Optional OpenAI credentials for internal interview summary (user secrets / env).</summary>
public sealed class OpenAiOptions
{
    public const string SectionName = "OpenAI";

    /// <summary>Bearer token for https://api.openai.com (starts with sk-…).</summary>
    public string? ApiKey { get; set; }

    /// <summary>Chat Completions model id (default gpt-4o-mini).</summary>
    public string ChatModel { get; set; } = "gpt-4o-mini";
}
