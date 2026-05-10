using System.Text.Json;
using System.Text.Json.Serialization;
using DemoEnglish.Api;
using DemoEnglish.Infrastructure;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// `http://0.0.0.0:…` in launchSettings can still end up loopback-only on some hosts; `*` binds all interfaces (LAN / iPhone).
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://*:5183", "https://*:7282");
}

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = UploadLimits.MaxMultipartBytes;
});

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "DemoEnglish API",
            Version = "v1",
            Description =
                "Definiciones (Free Dictionary API) e importación Anki: texto (.txt/.csv) y paquetes .apkg (SQLite).",
        });
});

var corsSection = builder.Configuration.GetSection("Cors:AllowedOrigins");
var allowedOrigins = corsSection.Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "Frontend",
        policy =>
        {
            if (builder.Environment.IsDevelopment())
            {
                // Phone / other PCs use http://<LAN-IP>:5173 — origins are not localhost.
                policy.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod();
            }
            else
            {
                policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
            }
        });
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = UploadLimits.MaxMultipartBytes;
});

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = UploadLimits.MaxMultipartBytes;
});

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();

// Helps Swagger UI (large JS/CSS) over LAN / Wi‑Fi to phones.
app.UseResponseCompression();

// CORS before Swagger so browser / Swagger UI requests are not blocked by middleware order.
app.UseCors("Frontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "DemoEnglish API v1");
        options.RoutePrefix = "swagger";
        // Swashbuckle omits null JSON properties; Swagger UI then defaults to the online validator,
        // which can hang “Loading…” on phones with slow or flaky internet. Empty string disables it.
        options.ConfigObject.ValidatorUrl = string.Empty;
    });
}

// In Development, LAN clients use http://<PC>:5183; HTTPS redirect breaks phones (dev cert).
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
