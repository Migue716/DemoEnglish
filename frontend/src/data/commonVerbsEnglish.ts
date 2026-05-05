/** High-frequency verbs with principal parts (study reference). */

export type CommonVerbRow = {
  /** Base form (infinitive without *to*) */
  base: string
  /** Present simple 3rd person singular */
  sg3: string
  past: string
  participle: string
  /** Present participle / gerund */
  ing: string
}

/** Common in speech & workplace English; forms are standard American/British overlap. */
export const commonVerbsPrincipalParts: CommonVerbRow[] = [
  { base: 'be', sg3: 'is', past: 'was / were', participle: 'been', ing: 'being' },
  { base: 'have', sg3: 'has', past: 'had', participle: 'had', ing: 'having' },
  { base: 'do', sg3: 'does', past: 'did', participle: 'done', ing: 'doing' },
  { base: 'say', sg3: 'says', past: 'said', participle: 'said', ing: 'saying' },
  { base: 'get', sg3: 'gets', past: 'got', participle: 'got / gotten', ing: 'getting' },
  { base: 'make', sg3: 'makes', past: 'made', participle: 'made', ing: 'making' },
  { base: 'go', sg3: 'goes', past: 'went', participle: 'gone', ing: 'going' },
  { base: 'know', sg3: 'knows', past: 'knew', participle: 'known', ing: 'knowing' },
  { base: 'take', sg3: 'takes', past: 'took', participle: 'taken', ing: 'taking' },
  { base: 'see', sg3: 'sees', past: 'saw', participle: 'seen', ing: 'seeing' },
  { base: 'come', sg3: 'comes', past: 'came', participle: 'come', ing: 'coming' },
  { base: 'think', sg3: 'thinks', past: 'thought', participle: 'thought', ing: 'thinking' },
  { base: 'look', sg3: 'looks', past: 'looked', participle: 'looked', ing: 'looking' },
  { base: 'use', sg3: 'uses', past: 'used', participle: 'used', ing: 'using' },
  { base: 'find', sg3: 'finds', past: 'found', participle: 'found', ing: 'finding' },
  { base: 'give', sg3: 'gives', past: 'gave', participle: 'given', ing: 'giving' },
  { base: 'tell', sg3: 'tells', past: 'told', participle: 'told', ing: 'telling' },
  { base: 'work', sg3: 'works', past: 'worked', participle: 'worked', ing: 'working' },
  { base: 'call', sg3: 'calls', past: 'called', participle: 'called', ing: 'calling' },
  { base: 'try', sg3: 'tries', past: 'tried', participle: 'tried', ing: 'trying' },
  { base: 'ask', sg3: 'asks', past: 'asked', participle: 'asked', ing: 'asking' },
  { base: 'need', sg3: 'needs', past: 'needed', participle: 'needed', ing: 'needing' },
  { base: 'feel', sg3: 'feels', past: 'felt', participle: 'felt', ing: 'feeling' },
  { base: 'become', sg3: 'becomes', past: 'became', participle: 'become', ing: 'becoming' },
  { base: 'leave', sg3: 'leaves', past: 'left', participle: 'left', ing: 'leaving' },
  { base: 'put', sg3: 'puts', past: 'put', participle: 'put', ing: 'putting' },
  { base: 'mean', sg3: 'means', past: 'meant', participle: 'meant', ing: 'meaning' },
  { base: 'keep', sg3: 'keeps', past: 'kept', participle: 'kept', ing: 'keeping' },
  { base: 'let', sg3: 'lets', past: 'let', participle: 'let', ing: 'letting' },
  { base: 'begin', sg3: 'begins', past: 'began', participle: 'begun', ing: 'beginning' },
  { base: 'seem', sg3: 'seems', past: 'seemed', participle: 'seemed', ing: 'seeming' },
  { base: 'help', sg3: 'helps', past: 'helped', participle: 'helped', ing: 'helping' },
  { base: 'talk', sg3: 'talks', past: 'talked', participle: 'talked', ing: 'talking' },
  { base: 'turn', sg3: 'turns', past: 'turned', participle: 'turned', ing: 'turning' },
  { base: 'start', sg3: 'starts', past: 'started', participle: 'started', ing: 'starting' },
  { base: 'show', sg3: 'shows', past: 'showed', participle: 'shown / showed', ing: 'showing' },
  { base: 'hear', sg3: 'hears', past: 'heard', participle: 'heard', ing: 'hearing' },
  { base: 'play', sg3: 'plays', past: 'played', participle: 'played', ing: 'playing' },
  { base: 'run', sg3: 'runs', past: 'ran', participle: 'run', ing: 'running' },
  { base: 'move', sg3: 'moves', past: 'moved', participle: 'moved', ing: 'moving' },
  { base: 'live', sg3: 'lives', past: 'lived', participle: 'lived', ing: 'living' },
  { base: 'believe', sg3: 'believes', past: 'believed', participle: 'believed', ing: 'believing' },
]
