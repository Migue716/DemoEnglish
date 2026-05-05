/** Reference formulas for English verb tenses (study aid). */

export type TenseTheoryBlock = {
  id: string
  title: string
  formula: string
  usage: string
  example: string
}

export const verbTenseTheoryBlocks: TenseTheoryBlock[] = [
  {
    id: 'pres-simple',
    title: 'Present simple',
    formula: 'Subject + base verb (+ *s/es* for he/she/it)\nNeg: Subject + *do/does not* + base verb\nQ: *Do/Does* + subject + base verb?',
    usage: 'Habits, facts, schedules, general truths.',
    example: 'The server **restarts** nightly. / **Do** you **use** Docker?',
  },
  {
    id: 'pres-cont',
    title: 'Present continuous',
    formula: 'Subject + *am/is/are* + verb-*ing*\nNeg: Subject + *am/is/are not* + verb-*ing*',
    usage: 'Actions happening now, temporary situations, plans near future.',
    example: 'We **are deploying** right now. / She **is not joining** the call.',
  },
  {
    id: 'pres-perf',
    title: 'Present perfect',
    formula: 'Subject + *have/has* + past participle\nNeg: Subject + *have/has not* + past participle\nQ: *Have/Has* + subject + past participle?',
    usage: 'Experience, unfinished time periods, result affecting now (often with *already/yet/just*).',
    example: 'I **have finished** the ticket. / **Have** you **seen** the new API docs?',
  },
  {
    id: 'pres-perf-cont',
    title: 'Present perfect continuous',
    formula: 'Subject + *have/has been* + verb-*ing*',
    usage: 'Duration up to now; emphasis on length of activity (*for/since*).',
    example: 'She **has been debugging** since 9 a.m.',
  },
  {
    id: 'past-simple',
    title: 'Past simple',
    formula: 'Subject + past form (regular: *-ed*)\nNeg/Q: *Did* + subject + base verb',
    usage: 'Finished actions at a specific time in the past.',
    example: 'We **merged** yesterday. / **Did** they **approve** the PR?',
  },
  {
    id: 'past-cont',
    title: 'Past continuous',
    formula: 'Subject + *was/were* + verb-*ing*',
    usage: 'Action in progress at a past moment; background when another action interrupted.',
    example: 'I **was reviewing** code when the alert **went** off.',
  },
  {
    id: 'past-perf',
    title: 'Past perfect',
    formula: 'Subject + *had* + past participle',
    usage: 'Earlier past action before another past action (*before*, *after*, *by the time*).',
    example: 'The bug **had reached** prod **before** we noticed.',
  },
  {
    id: 'past-perf-cont',
    title: 'Past perfect continuous',
    formula: 'Subject + *had been* + verb-*ing*',
    usage: 'Duration of an activity before a point in the past.',
    example: 'They **had been waiting** for CI **for** two hours.',
  },
  {
    id: 'will-future',
    title: 'Future — *will*',
    formula: 'Subject + *will* + base verb\nNeg: Subject + *will not / won’t* + base verb',
    usage: 'Predictions, instant decisions, promises.',
    example: 'The build **will fail** if we skip tests. / I **will send** the recap.',
  },
  {
    id: 'going-to',
    title: 'Future — *going to*',
    formula: 'Subject + *am/is/are going to* + base verb',
    usage: 'Plans/intentions; evidence something will happen.',
    example: 'We **are going to release** on Friday.',
  },
  {
    id: 'fut-cont',
    title: 'Future continuous',
    formula: 'Subject + *will be* + verb-*ing*',
    usage: 'Action in progress at a future time.',
    example: 'This time tomorrow I **will be presenting** the demo.',
  },
  {
    id: 'fut-perf',
    title: 'Future perfect',
    formula: 'Subject + *will have* + past participle',
    usage: 'Completed before a future point (*by*, *by the time*).',
    example: 'By 6 p.m. we **will have deployed** the hotfix.',
  },
]

export const verbTenseTheoryExtra: { title: string; body: string }[] = [
  {
    title: 'Modals (quick pattern)',
    body: `**can / could** — ability, possibility, permission  
**may / might** — possibility (might = weaker)  
**must** — strong obligation / logical certainty  
**should / ought to** — advice, expectation  
**have to / don’t have to** — external obligation vs no obligation  

Form: modal + **base verb** (no *to* except *ought to*, *have to* behaves like a full verb for questions/negatives in speech).`,
  },
  {
    title: 'Passive voice',
    body: `**Be** + past participle (tense is shown on *be*):

The ticket **was closed**. The API **is being tested**. The feature **will be shipped**.

By-agent (optional): add **by** + the doer (e.g. *by the team*).`,
  },
  {
    title: 'Conditionals — structure',
    body: `**Zero:** If + present, present — general truths.  
**First:** If + present, *will* + base — real future.  
**Second:** If + past simple, *would* + base — unreal present/future.  
**Third:** If + past perfect, *would have* + participle — unreal past.`,
  },
]
