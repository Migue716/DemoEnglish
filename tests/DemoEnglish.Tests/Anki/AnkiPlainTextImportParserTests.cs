using DemoEnglish.Application.Anki;

namespace DemoEnglish.Tests.Anki;

public sealed class AnkiPlainTextImportParserTests
{
    private readonly AnkiPlainTextImportParser _parser = new();

    [Fact]
    public void Parse_TabSeparated_ParsesTwoColumns()
    {
        var text = "hello\tworld\nsecond\tline";
        var r = _parser.Parse(text, "deck.txt");

        Assert.Equal(2, r.Cards.Count);
        Assert.Equal("hello", r.Cards[0].Front);
        Assert.Equal("world", r.Cards[0].Back);
        Assert.Equal("second", r.Cards[1].Front);
        Assert.Equal("line", r.Cards[1].Back);
    }

    [Fact]
    public void Parse_Semicolon_WhenNoTab()
    {
        var text = "front one;back one";
        var r = _parser.Parse(text, "x.txt");

        Assert.Single(r.Cards);
        Assert.Equal("front one", r.Cards[0].Front);
        Assert.Equal("back one", r.Cards[0].Back);
    }

    [Fact]
    public void Parse_RespectsSeparatorDirective()
    {
        var text = "#separator:Semicolon\na;b";
        var r = _parser.Parse(text, "x.txt");

        Assert.Single(r.Cards);
        Assert.Equal("a", r.Cards[0].Front);
        Assert.Equal("b", r.Cards[0].Back);
    }

    [Fact]
    public void Parse_CsvExtension_UsesComma()
    {
        var text = "one,two";
        var r = _parser.Parse(text, "f.csv");

        Assert.Single(r.Cards);
        Assert.Equal("one", r.Cards[0].Front);
        Assert.Equal("two", r.Cards[0].Back);
    }

    [Fact]
    public void Parse_SkipsCommentsAndBlankLines()
    {
        var text = "# comment\n\na\tb\n";
        var r = _parser.Parse(text, "x.txt");

        Assert.Single(r.Cards);
    }
}
