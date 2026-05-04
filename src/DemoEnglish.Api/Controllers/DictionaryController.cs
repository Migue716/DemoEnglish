using DemoEnglish.Application.Dictionary;
using Microsoft.AspNetCore.Mvc;

namespace DemoEnglish.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DictionaryController : ControllerBase
{
    private readonly IDictionaryLookupService _dictionaryLookup;

    public DictionaryController(IDictionaryLookupService dictionaryLookup)
    {
        _dictionaryLookup = dictionaryLookup;
    }

    /// <summary>Looks up an English word and returns a simplified definition payload.</summary>
    [HttpGet("entries/{word}")]
    [ProducesResponseType(typeof(WordDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GetEntry(string word, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return Problem(
                title: "Invalid word",
                detail: "The search term cannot be empty.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await _dictionaryLookup.LookupAsync(word, cancellationToken).ConfigureAwait(false);

        return result switch
        {
            DictionaryLookupResult.Found found => Ok(found.Definition),
            DictionaryLookupResult.WordNotFound notFound => NotFound(new ProblemDetails
            {
                Title = "Word not found",
                Detail = $"No dictionary entry was found for \"{notFound.Word}\".",
                Status = StatusCodes.Status404NotFound
            }),
            DictionaryLookupResult.TransientError err => StatusCode(
                StatusCodes.Status502BadGateway,
                new ProblemDetails
                {
                    Title = "Dictionary service error",
                    Detail = err.Message,
                    Status = StatusCodes.Status502BadGateway
                }),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
