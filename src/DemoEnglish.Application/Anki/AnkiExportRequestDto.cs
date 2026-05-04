using System.ComponentModel.DataAnnotations;

namespace DemoEnglish.Application.Anki;

public sealed class AnkiExportRequestDto
{
    [Required]
    [MinLength(1)]
    public List<AnkiExportCardDto> Cards { get; set; } = [];
}

public sealed class AnkiExportCardDto
{
    [Required]
    [StringLength(20_000)]
    public string Front { get; set; } = string.Empty;

    [Required]
    [StringLength(50_000)]
    public string Back { get; set; } = string.Empty;
}
