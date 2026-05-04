using DemoEnglish.Infrastructure.Dictionary;
using DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

namespace DemoEnglish.Tests.Dictionary;

public sealed class WordDefinitionMapperTests
{
    [Fact]
    public void TryMap_UsesRootPhoneticAndFirstMeaningDefinition()
    {
        var entry = new FreeDictionaryEntry
        {
            Word = "hello",
            Phonetic = "/həˈləʊ/",
            Phonetics = new List<FreeDictionaryPhonetic>
            {
                new() { Text = "/ignored/", Audio = "https://example.com/hello.mp3" }
            },
            Meanings = new List<FreeDictionaryMeaning>
            {
                new()
                {
                    PartOfSpeech = "noun",
                    Definitions = new List<FreeDictionaryDefinition>
                    {
                        new() { Definition = "A greeting." }
                    }
                }
            }
        };

        var dto = WordDefinitionMapper.TryMap(entry);

        Assert.NotNull(dto);
        Assert.Equal("hello", dto.Word);
        Assert.Equal("/həˈləʊ/", dto.PhoneticText);
        Assert.Equal("https://example.com/hello.mp3", dto.AudioUrl);
        Assert.Equal("A greeting.", dto.PrimaryDefinition);
        Assert.Equal("noun", dto.PartOfSpeech);
    }

    [Fact]
    public void TryMap_FallsBackToPhoneticText_WhenRootPhoneticMissing()
    {
        var entry = new FreeDictionaryEntry
        {
            Word = "hello",
            Phonetics = new List<FreeDictionaryPhonetic>
            {
                new() { Text = "/həˈləʊ/", Audio = "" }
            },
            Meanings = new List<FreeDictionaryMeaning>
            {
                new()
                {
                    PartOfSpeech = "interjection",
                    Definitions = new List<FreeDictionaryDefinition>
                    {
                        new() { Definition = "A greeting said when meeting." }
                    }
                }
            }
        };

        var dto = WordDefinitionMapper.TryMap(entry);

        Assert.NotNull(dto);
        Assert.Equal("/həˈləʊ/", dto.PhoneticText);
    }

    [Fact]
    public void TryMap_ReturnsNull_WhenNoDefinitions()
    {
        var entry = new FreeDictionaryEntry
        {
            Word = "ghost",
            Meanings = new List<FreeDictionaryMeaning>()
        };

        Assert.Null(WordDefinitionMapper.TryMap(entry));
    }
}
