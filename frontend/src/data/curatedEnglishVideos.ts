/** Curated YouTube picks (external lessons). Links only — opens on YouTube. */

export type CuratedVideoPick = {
  videoId: string
  /** oEmbed title (kept concise in UI). */
  title: string
  /** Extra context shown under the title. */
  hint?: string
}

export type CuratedVideoTopic = {
  id: string
  heading: string
  description: string
  picks: CuratedVideoPick[]
}

export const curatedEnglishVideoTopics: CuratedVideoTopic[] = [
  {
    id: 'useful-general',
    heading: 'Useful everyday English topics',
    description:
      'Professional vocabulary, polite suggestions, grammar that shows up everywhere at work—not only in tech docs.',
    picks: [
      {
        videoId: 'pfRw6wg-QqE',
        title: '5 things you MUST KNOW to master Professional English | Business English',
        hint: 'Small talk, presenting ideas, asking for clarification.',
      },
      {
        videoId: 'K7YCzpBA1Nw',
        title: 'If you know these 15 phrases, your professional English is EXCELLENT!',
        hint: 'Handy idioms often used in emails and Slack (touch base, in the loop, …).',
      },
      {
        videoId: 'owzPL9jaSU8',
        title: 'What English people SAY vs What English people MEAN!',
        hint: 'Subtext behind polite workplace English—helps read feedback and replies.',
      },
      {
        videoId: '7wT7BzAoyj0',
        title: 'Making Suggestions in English - Spoken English Lesson',
        hint: 'Phrases for proposing ideas without sounding blunt.',
      },
      {
        videoId: 'vXp0ETWXbWo',
        title: 'THE CONDITIONALS - 0,1,2 & 3 (+ quiz)',
        hint: 'If/when hypotheticals in specs, RFCs, and design discussions.',
      },
      {
        videoId: 'eRzWQo_j3Gg',
        title: 'Learn ALL Modal Verbs in English In Only 15 | Complete English Grammar Lesson',
        hint: 'Can, must, should, etc.—common in docs and code comments.',
      },
      {
        videoId: '38QqDrckyxM',
        title: 'How to use the active and passive voice - 6 Minute Grammar',
        hint: 'Passives (“the bug was fixed”) in tickets and retros.',
      },
    ],
  },
  {
    id: 'tech-interviews',
    heading: 'Technical interviews',
    description:
      'Behavioral answers, communicating while you solve problems, and high-level design discussions in English.',
    picks: [
      {
        videoId: 'zoGZQatkqKg',
        title: 'Behavioral Interview Questions and Answers: Use the STAR Technique | Indeed Career Tips',
        hint: 'Short intro to structuring stories.',
      },
      {
        videoId: 'crzHgef-x1c',
        title: 'BEHAVIOURAL QUESTIONS & ANSWERS (STAR method)',
        hint: 'Many example answers you can outline in your own words.',
      },
      {
        videoId: 'Ti5vfu9arXQ',
        title: 'How to solve a Google coding interview question',
        hint: 'Mock interview—notice question phrasing and thinking aloud in English.',
      },
      {
        videoId: 'ckW4cUqui_w',
        title: 'How to PASS a Coding Interview - Tips, Advice & Resources',
        hint: 'Communicating trade-offs and your plan clearly.',
      },
      {
        videoId: 'F2FmTdLtb_4',
        title: 'System Design Concepts Course and Interview Prep',
        hint: 'Long primer on concepts and terminology (freeCodeCamp.org).',
      },
      {
        videoId: '2kEMI3i5saQ',
        title: 'System Design Interview: Step-by-step Guide from ex-FAANG Software Engineer',
        hint: 'Framework for structuring a spoken system design.',
      },
    ],
  },
  {
    id: 'programmer-daily',
    heading: 'Day-to-day English as a developer',
    description:
      'Standups, meetings, and vocabulary you use every sprint—updates, feedback, and code review.',
    picks: [
      {
        videoId: 'qqfy3GyNfTM',
        title: 'Mastering English for Daily Standups: Discussing Project Updates',
        hint: 'Status updates, blockers, and natural phrasing.',
      },
      {
        videoId: 'Awr3wHO3Tgg',
        title: '6 Communication Tips for Software Engineers in Meetings',
        hint: 'Being clear and visible without rambling.',
      },
      {
        videoId: 'd9_fweNDjKw',
        title: 'Better Code Reviews in 6 SIMPLE STEPS',
        hint: 'How reviews work—helps you phrase PR comments constructively.',
      },
      {
        videoId: 'Z4HZ0mC89ng',
        title: 'How REAL Senior Developers Review PRs | PR review hacks',
        hint: 'Real review flow and jargon you hear on teams.',
      },
    ],
  },
]
