using DemoEnglish.Application.Dictionary;
using DemoEnglish.Infrastructure.Dictionary.FreeDictionary;

namespace DemoEnglish.Infrastructure.Dictionary;

public static class WordDefinitionMapper
{
    public static WordDefinitionDto? TryMap(FreeDictionaryEntry entry)
    {
        if (string.IsNullOrWhiteSpace(entry.Word))
            return null;

        var phoneticText = ResolvePhoneticText(entry);
        var audioUrl = ResolveAudioUrl(entry);
        var (definition, partOfSpeech) = ResolvePrimaryDefinition(entry);

        if (string.IsNullOrWhiteSpace(definition))
            return null;

        return new WordDefinitionDto(
            Word: entry.Word.Trim(),
            PhoneticText: string.IsNullOrWhiteSpace(phoneticText) ? null : phoneticText.Trim(),
            AudioUrl: string.IsNullOrWhiteSpace(audioUrl) ? null : audioUrl.Trim(),
            PrimaryDefinition: definition.Trim(),
            PartOfSpeech: string.IsNullOrWhiteSpace(partOfSpeech) ? null : partOfSpeech.Trim());
    }

    private static string? ResolvePhoneticText(FreeDictionaryEntry entry)
    {
        if (!string.IsNullOrWhiteSpace(entry.Phonetic))
            return entry.Phonetic;

        if (entry.Phonetics is null)
            return null;

        foreach (var p in entry.Phonetics)
        {
            if (!string.IsNullOrWhiteSpace(p.Text))
                return p.Text;
        }

        return null;
    }

    private static string? ResolveAudioUrl(FreeDictionaryEntry entry)
    {
        if (entry.Phonetics is null)
            return null;

        foreach (var p in entry.Phonetics)
        {
            if (!string.IsNullOrWhiteSpace(p.Audio))
                return p.Audio;
        }

        return null;
    }

    private static (string? Definition, string? PartOfSpeech) ResolvePrimaryDefinition(FreeDictionaryEntry entry)
    {
        if (entry.Meanings is null)
            return (null, null);

        foreach (var meaning in entry.Meanings)
        {
            if (meaning.Definitions is null)
                continue;

            foreach (var def in meaning.Definitions)
            {
                if (!string.IsNullOrWhiteSpace(def.Definition))
                    return (def.Definition, meaning.PartOfSpeech);
            }
        }

        return (null, null);
    }
}
