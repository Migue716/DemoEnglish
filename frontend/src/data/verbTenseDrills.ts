/** Multiple-choice drills for common English verb patterns (tech/work context where possible). */

export type VerbTenseTopic =
  | 'present'
  | 'past'
  | 'perfect'
  | 'future'
  | 'modals'
  | 'conditionals'
  | 'passive'
  | 'gerund'

export type VerbTenseDrill = {
  id: string
  topic: VerbTenseTopic
  /** Short grammar label shown in the UI */
  tenseLabel: string
  /** Sentence with ___ marking the gap */
  prompt: string
  correct: string
  /** Three incorrect options (four choices total with correct) */
  distractors: [string, string, string]
}

export const verbTenseTopicLabels: Record<VerbTenseTopic | 'all', string> = {
  all: 'All topics',
  present: 'Present (simple / continuous)',
  past: 'Past (simple / continuous)',
  perfect: 'Perfect tenses',
  future: 'Future (will / going to)',
  modals: 'Modals & semi-modals',
  conditionals: 'Conditionals',
  passive: 'Passive voice',
  gerund: 'Gerund & infinitive',
}

export const verbTenseDrills: VerbTenseDrill[] = [
  {
    id: 'ps-1',
    topic: 'present',
    tenseLabel: 'Present simple (3rd person)',
    prompt: 'The pipeline ___ every night at 2 a.m.',
    correct: 'runs',
    distractors: ['run', 'running', 'ran'],
  },
  {
    id: 'ps-2',
    topic: 'present',
    tenseLabel: 'Present simple (habits)',
    prompt: 'She usually ___ stand-up on Tuesdays.',
    correct: "doesn't miss",
    distractors: ['misses', 'missed', 'is missing'],
  },
  {
    id: 'pc-1',
    topic: 'present',
    tenseLabel: 'Present continuous (now)',
    prompt: 'Quiet — the team ___ the release right now.',
    correct: 'is testing',
    distractors: ['tests', 'tested', 'has tested'],
  },
  {
    id: 'past-1',
    topic: 'past',
    tenseLabel: 'Past simple',
    prompt: 'Yesterday we ___ the root cause in production logs.',
    correct: 'found',
    distractors: ['find', 'finding', 'have found'],
  },
  {
    id: 'past-2',
    topic: 'past',
    tenseLabel: 'Past continuous',
    prompt: 'While I ___ the docs, the build finished.',
    correct: 'was reviewing',
    distractors: ['reviewed', 'have reviewed', 'am reviewing'],
  },
  {
    id: 'pp-1',
    topic: 'perfect',
    tenseLabel: 'Present perfect (experience / result)',
    prompt: 'I ___ this error before — check ticket #4421.',
    correct: 'have seen',
    distractors: ['saw', 'see', 'was seeing'],
  },
  {
    id: 'pp-2',
    topic: 'perfect',
    tenseLabel: 'Present perfect continuous',
    prompt: 'She ___ on this refactor since Monday.',
    correct: 'has been working',
    distractors: ['works', 'worked', 'is working'],
  },
  {
    id: 'pap-1',
    topic: 'perfect',
    tenseLabel: 'Past perfect',
    prompt: 'By the time we deployed, the bug ___ for hours.',
    correct: 'had been live',
    distractors: ['was', 'has been', 'is'],
  },
  {
    id: 'fut-1',
    topic: 'future',
    tenseLabel: 'Will (prediction)',
    prompt: 'I think the review ___ tomorrow afternoon.',
    correct: 'will finish',
    distractors: ['finishes', 'finished', 'is finishing'],
  },
  {
    id: 'fut-2',
    topic: 'future',
    tenseLabel: 'Going to (plan)',
    prompt: 'We ___ a design doc before the sprint starts.',
    correct: 'are going to write',
    distractors: ['write', 'wrote', 'have written'],
  },
  {
    id: 'mod-1',
    topic: 'modals',
    tenseLabel: 'Must (strong obligation)',
    prompt: 'You ___ pin dependency versions in production.',
    correct: 'must',
    distractors: ['might', 'could', 'would'],
  },
  {
    id: 'mod-2',
    topic: 'modals',
    tenseLabel: 'Should (recommendation)',
    prompt: 'We ___ add monitoring before launch.',
    correct: 'should',
    distractors: ['must not', 'might not', "needn't"],
  },
  {
    id: 'cond-1',
    topic: 'conditionals',
    tenseLabel: 'Second conditional',
    prompt: 'If I ___ the lead, I would prioritise testing.',
    correct: 'were',
    distractors: ['was', 'am', 'had been'],
  },
  {
    id: 'cond-2',
    topic: 'conditionals',
    tenseLabel: 'First conditional',
    prompt: 'If the tests fail, the deploy ___.',
    correct: 'will block',
    distractors: ['blocked', 'would block', 'blocks'],
  },
  {
    id: 'pas-1',
    topic: 'passive',
    tenseLabel: 'Present passive',
    prompt: 'The API ___ by thousands of clients.',
    correct: 'is used',
    distractors: ['uses', 'using', 'has used'],
  },
  {
    id: 'pas-2',
    topic: 'passive',
    tenseLabel: 'Past passive',
    prompt: 'The incident ___ last Friday.',
    correct: 'was resolved',
    distractors: ['resolved', 'has resolved', 'is resolving'],
  },
  {
    id: 'ger-1',
    topic: 'gerund',
    tenseLabel: 'Gerund after enjoy',
    prompt: 'I enjoy ___ new languages at work.',
    correct: 'learning',
    distractors: ['learn', 'to learn', 'learned'],
  },
  {
    id: 'ger-2',
    topic: 'gerund',
    tenseLabel: 'Infinitive of purpose',
    prompt: 'We refactored the module ___ readability.',
    correct: 'to improve',
    distractors: ['improving', 'improve', 'improved'],
  },
]
