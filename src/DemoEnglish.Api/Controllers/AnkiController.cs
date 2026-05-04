using System.Text;
using DemoEnglish.Api;
using DemoEnglish.Application.Anki;
using Microsoft.AspNetCore.Mvc;

namespace DemoEnglish.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[RequestFormLimits(MultipartBodyLengthLimit = UploadLimits.MaxMultipartBytes)]
public sealed class AnkiController : ControllerBase
{
    private const int MaxExportCards = 5_000;

    private readonly IAnkiPlainTextImportParser _plainTextParser;
    private readonly IAnkiApkgImportReader _apkgReader;

    public AnkiController(IAnkiPlainTextImportParser plainTextParser, IAnkiApkgImportReader apkgReader)
    {
        _plainTextParser = plainTextParser;
        _apkgReader = apkgReader;
    }

    /// <summary>Imports Anki plain text (.txt / .tsv / .csv) or a package (.apkg).</summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(AnkiImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportDeck(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return Problem(
                title: "No file",
                detail: "Upload a non-empty .txt, .tsv, .csv, or .apkg file.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is ".apkg")
        {
            await using var upload = file.OpenReadStream();
            var result = await _apkgReader.ReadAsync(upload, cancellationToken).ConfigureAwait(false);
            return Ok(result);
        }

        if (ext is not (".txt" or ".tsv" or ".csv"))
        {
            return Problem(
                title: "Unsupported extension",
                detail: "Use .txt, .tsv, .csv, or .apkg.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var text = await reader.ReadToEndAsync(cancellationToken).ConfigureAwait(false);

        var plainResult = _plainTextParser.Parse(text, file.FileName, cancellationToken);
        return Ok(plainResult);
    }

    /// <summary>Exports cards as UTF-8 text with tab separator (Anki → Import).</summary>
    [HttpPost("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult ExportPlainText([FromBody] AnkiExportRequestDto body)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (body.Cards.Count > MaxExportCards)
        {
            return Problem(
                title: "Too many cards",
                detail: $"Maximum {MaxExportCards:N0} cards per export.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var sb = new StringBuilder();
        sb.AppendLine("#separator:tab");
        foreach (var c in body.Cards)
            sb.AppendLine($"{SanitizeField(c.Front)}\t{SanitizeField(c.Back)}");

        var utf8Bom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);
        return File(utf8Bom.GetBytes(sb.ToString()), "text/plain; charset=utf-8", "anki-export.txt");
    }

    /// <summary>Example deck fragment you can import into Anki or this app.</summary>
    [HttpGet("sample")]
    public IActionResult DownloadSample()
    {
        const string sample =
            "#separator:tab\n" +
            "What is a race condition?\tTwo threads access shared state without proper synchronization; outcomes become unpredictable.\n" +
            "Idempotent operation\tAn operation you can apply more than once without changing the result beyond the first application.\n" +
            "Throughput\tThe amount of work completed per unit of time (e.g. requests per second).\n";
        var utf8Bom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);
        return File(utf8Bom.GetBytes(sample), "text/plain; charset=utf-8", "sample-tech-english.txt");
    }

    private static string SanitizeField(string value)
    {
        var t = value.Replace("\t", " ", StringComparison.Ordinal).ReplaceLineEndings("<br>");
        return t.Trim();
    }
}
