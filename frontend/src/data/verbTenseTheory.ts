/** Reference formulas for English verb tenses (study aid). */

/** Optional YouTube explainer (embedded behind a disclosure in the theory dialog). */
export type TenseTheoryYoutube = {
  videoId: string
  /** Shown on the summary row; defaults to a generic label in the UI. */
  label?: string
}

export type TenseTheoryBlock = {
  id: string
  title: string
  formula: string
  usage: string
  example: string
  /** Short lesson for this tense (collapsible; iframe loads when opened). */
  youtube: TenseTheoryYoutube
}

/**
 * Featured overview video at the top of the tense theory dialog (secondary / collapsible).
 * Replace videoId to point at another lesson if you prefer a different channel or length.
 */
export const verbTenseTheoryFeaturedVideo: TenseTheoryYoutube & { label: string } = {
  videoId: 'd0wV9EC3t14',
  label: 'All English tenses overview (~20 min, EnglishClass101)',
}

export const verbTenseTheoryBlocks: TenseTheoryBlock[] = [
  {
    id: 'pres-simple',
    title: 'Present simple',
    formula: 'Subject + base verb (+ *s/es* for he/she/it)\nNeg: Subject + *do/does not* + base verb\nQ: *Do/Does* + subject + base verb?',
    usage: 'Habits, facts, schedules, general truths.',
    example: 'The server **restarts** nightly. / **Do** you **use** Docker?',
    youtube: {
      videoId: 'X6LuWwb9whM',
      label: 'BBC Learning English: How to use present tenses (incl. present simple)',
    },
  },
  {
    id: 'pres-cont',
    title: 'Present continuous',
    formula: 'Subject + *am/is/are* + verb-*ing*\nNeg: Subject + *am/is/are not* + verb-*ing*',
    usage: 'Actions happening now, temporary situations, plans near future.',
    example: 'We **are deploying** right now. / She **is not joining** the call.',
    youtube: {
      videoId: 'QqxdZzOorAU',
      label: 'Present continuous — easy grammar lesson',
    },
  },
  {
    id: 'pres-perf',
    title: 'Present perfect',
    formula: 'Subject + *have/has* + past participle\nNeg: Subject + *have/has not* + past participle\nQ: *Have/Has* + subject + past participle?',
    usage: 'Experience, unfinished time periods, result affecting now (often with *already/yet/just*).',
    example: 'I **have finished** the ticket. / **Have** you **seen** the new API docs?',
    youtube: {
      videoId: 'sSZcAh42qtI',
      label: 'BBC Learning English: present perfect with *for* and *since*',
    },
  },
  {
    id: 'pres-perf-cont',
    title: 'Present perfect continuous',
    formula: 'Subject + *have/has been* + verb-*ing*',
    usage: 'Duration up to now; emphasis on length of activity (*for/since*).',
    example: 'She **has been debugging** since 9 a.m.',
    youtube: {
      videoId: 'pvoqkQHb3lo',
      label: 'BBC Learning English: present perfect simple vs continuous',
    },
  },
  {
    id: 'past-simple',
    title: 'Past simple',
    formula: 'Subject + past form (regular: *-ed*)\nNeg/Q: *Did* + subject + base verb',
    usage: 'Finished actions at a specific time in the past.',
    example: 'We **merged** yesterday. / **Did** they **approve** the PR?',
    youtube: {
      videoId: 'PgsG98vByiw',
      label: 'BBC Learning English: the past simple tense',
    },
  },
  {
    id: 'past-cont',
    title: 'Past continuous',
    formula: 'Subject + *was/were* + verb-*ing*',
    usage: 'Action in progress at a past moment; background when another action interrupted.',
    example: 'I **was reviewing** code when the alert **went** off.',
    youtube: {
      videoId: 'uTB5I8V9Eog',
      label: 'BBC Learning English: past simple & past continuous',
    },
  },
  {
    id: 'past-perf',
    title: 'Past perfect',
    formula: 'Subject + *had* + past participle',
    usage: 'Earlier past action before another past action (*before*, *after*, *by the time*).',
    example: 'The bug **had reached** prod **before** we noticed.',
    youtube: {
      videoId: 'Efo0-Eq0DTE',
      label: 'Past perfect tense — how and when to use it',
    },
  },
  {
    id: 'past-perf-cont',
    title: 'Past perfect continuous',
    formula: 'Subject + *had been* + verb-*ing*',
    usage: 'Duration of an activity before a point in the past.',
    example: 'They **had been waiting** for CI **for** two hours.',
    youtube: {
      videoId: 'NJ5MtHkcEJE',
      label: 'engVid: past perfect continuous',
    },
  },
  {
    id: 'will-future',
    title: 'Future — *will*',
    formula: 'Subject + *will* + base verb\nNeg: Subject + *will not / won’t* + base verb',
    usage: 'Predictions, instant decisions, promises.',
    example: 'The build **will fail** if we skip tests. / I **will send** the recap.',
    youtube: {
      videoId: 'elPHkXNxi2g',
      label: 'BBC Learning English: how to talk about the future (incl. *will*)',
    },
  },
  {
    id: 'going-to',
    title: 'Future — *going to*',
    formula: 'Subject + *am/is/are going to* + base verb',
    usage: 'Plans/intentions; evidence something will happen.',
    example: 'We **are going to release** on Friday.',
    youtube: {
      videoId: 'Ido7cdHIYLo',
      label: 'BBC Learning English: *will* vs *going to* (live class)',
    },
  },
  {
    id: 'fut-cont',
    title: 'Future continuous',
    formula: 'Subject + *will be* + verb-*ing*',
    usage: 'Action in progress at a future time.',
    example: 'This time tomorrow I **will be presenting** the demo.',
    youtube: {
      videoId: 'p083mXSpdkc',
      label: 'Future simple, continuous & perfect — explained simply',
    },
  },
  {
    id: 'fut-perf',
    title: 'Future perfect',
    formula: 'Subject + *will have* + past participle',
    usage: 'Completed before a future point (*by*, *by the time*).',
    example: 'By 6 p.m. we **will have deployed** the hotfix.',
    youtube: {
      videoId: 'zG2-dCQMKxw',
      label: 'All main future tense forms explained',
    },
  },
]

export type TenseTheoryExtraBlock = {
  title: string
  body: string
  youtube?: TenseTheoryYoutube
}

export const verbTenseTheoryExtra: TenseTheoryExtraBlock[] = [
  {
    title: 'Modals (quick pattern)',
    body: `**can / could** — ability, possibility, permission  
**may / might** — possibility (might = weaker)  
**must** — strong obligation / logical certainty  
**should / ought to** — advice, expectation  
**have to / don’t have to** — external obligation vs no obligation  

Form: modal + **base verb** (no *to* except *ought to*, *have to* behaves like a full verb for questions/negatives in speech).`,
    youtube: {
      videoId: 'eRzWQo_j3Gg',
      label: 'All main modal verbs in English — grammar lesson (~15 min)',
    },
  },
  {
    title: 'Passive voice',
    body: `**Be** + past participle (tense is shown on *be*):

The ticket **was closed**. The API **is being tested**. The feature **will be shipped**.

By-agent (optional): add **by** + the doer (e.g. *by the team*).`,
    youtube: {
      videoId: '38QqDrckyxM',
      label: 'BBC Learning English: active and passive voice',
    },
  },
  {
    title: 'Conditionals — structure',
    body: `**Zero:** If + present, present — general truths.  
**First:** If + present, *will* + base — real future.  
**Second:** If + past simple, *would* + base — unreal present/future.  
**Third:** If + past perfect, *would have* + participle — unreal past.`,
    youtube: {
      videoId: 'vXp0ETWXbWo',
      label: 'Zero, first, second & third conditionals — overview + quiz',
    },
  },
]
