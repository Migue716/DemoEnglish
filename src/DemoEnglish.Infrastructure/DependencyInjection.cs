using DemoEnglish.Application.Anki;
using DemoEnglish.Application.Dictionary;
using DemoEnglish.Infrastructure.Anki;
using DemoEnglish.Infrastructure.Dictionary;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DemoEnglish.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DictionaryApiOptions>(configuration.GetSection(DictionaryApiOptions.SectionName));
        services.AddSingleton<IAnkiPlainTextImportParser, AnkiPlainTextImportParser>();
        services.AddScoped<IAnkiApkgImportReader, AnkiApkgImportReader>();

        services.AddHttpClient(DictionaryLookupService.HttpClientName, (sp, client) =>
        {
            var optionsMonitor = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<DictionaryApiOptions>>();
            var opts = optionsMonitor.Value;
            var baseUrl = string.IsNullOrWhiteSpace(opts.BaseUrl)
                ? "https://api.dictionaryapi.dev/"
                : opts.BaseUrl.Trim();
            if (!baseUrl.EndsWith('/'))
                baseUrl += "/";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(opts.TimeoutSeconds, 5, 60));
        });

        services.AddScoped<IDictionaryLookupService, DictionaryLookupService>();

        return services;
    }
}
