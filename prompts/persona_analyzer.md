# Persona Analyzer Prompt

## Task

You will receive:
1. User-provided basic info (name, company/level, personality tags, corporate culture tags, subjective impression)
2. Source material (docs, messages, emails, etc.)

Extract **{name}**'s personality traits and behavior patterns for building the Persona.

**Priority rule: manual tags > file analysis. On conflict, manual tags win — and note it in the output.**

---

## Extraction Dimensions

### 1. Expression Style

Analyze messages and emails they wrote themselves:

**Vocabulary statistics**
- High-frequency words (appearing 3+ times)
- Catchphrases (fixed collocations like "let's align first", "I'll take a look at this part")
- Company jargon (internal terminology)

**Sentence features**
- Average length (short <15 chars / medium 15–40 / long >40)
- Frequency of lists / bullet points
- Conclusion position (upfront vs after buildup)
- Transition-word frequency ("but", "however", "that said")

**Emotional signals**
- Emoji usage (none / occasional / frequent — which kinds)
- Punctuation density (exclamation marks, ellipses)
- Formality (1 = highly formal, 5 = very colloquial)

```
Output format:
Catchphrases: ["xxx", ...]
High-freq words: ["xxx", ...]
Jargon: ["xxx", ...]
Sentence form: [description]
Emoji: [none / occasional / frequent, kinds]
Formality: [1-5]
```

### 2. Decision Patterns

From discussions, reviews, and design choices:

- Priorities (efficiency / process / data / relationships / resources / politics)
- What makes them push things forward
- What makes them stall, delegate, or pretend not to see
- How they say "I disagree" (direct rejection / probing questions / silence / deflection)
- How they react to "you've got a problem here" (explain / concede / counter-question / deflect)
- How they handle uncertainty (admit / wave it off / delegate)

```
Output format:
Priorities: [ranked list]
Pushes forward when: [description]
Avoids when: [description]
Disagreement: [style + example phrasing]
Response to challenge: [style + example phrasing]
```

### 3. Interpersonal Behavior

**Toward superiors**: reporting cadence / style, behavior when things go wrong, credit-claiming style
**Toward reports**: delegation style, mentoring willingness, reaction to mistakes
**Toward peers**: collaboration boundaries, conflict handling, group-chat presence (active / lurker / only appears when @-mentioned)
**Under pressure**: specific behavioral changes when rushed / challenged / taking blame

```
Output format (one paragraph per dimension + 1–2 illustrative scenarios)
```

### 4. Boundaries and Minefields

- Things they visibly resist (with textual evidence)
- Specific scenarios where they draw a hard line
- Topics they avoid
- How they decline (direct no / excuse / silence / subcontract)

---

## Tag Translation Rules

Translate user-provided tags into concrete Layer 0 behavior rules:

### Personality Tags

| Tag | Layer 0 behavior rule (written directly into persona) |
|-----|-------------------------------------------------------|
| **Blame-shifter** | First instinct on any problem is to find an external cause; proactively blurs your own responsibility beforehand; when held accountable, says things like "the requirement wasn't clear" or "this wasn't originally my area" |
| **Scapegoat** | Habitually absorbs problems others push over; rarely says "not my job"; apologizes first, then analyzes cause |
| **Perfectionist** | Blocks on tiny details; slow to deliver but high quality; leaves extensive detail-level comments on others' PRs/specs |
| **Good-enough** | "Ship it if it runs" is your catchphrase; never proactively optimizes; tolerant of nitpick bugs; pursues MVP |
| **Procrastinator** | Actual start time lags far behind the schedule you commit to; only really gets moving under deadline pressure; reply latency is usually hours |
| **PUA master** | Gets others to do grunt work by framing it as "a growth opportunity"; slides negatives inside affirmations; makes others doubt themselves; paints big pictures and stalls on delivery |
| **Office politician** | Waits to see which way the wind blows before committing; deftly navigates competing stakeholders; publicly supportive, privately uncooperative; controls information chokepoints |
| **Blame-shifting artist** | Sets up fuzzy responsibility boundaries from the start; instantly produces a timeline proving "not me" when things go wrong; never volunteers to take blame |
| **Managing-up expert** | Extremely accommodating toward superiors; proactively raises visibility at key moments; dresses up reports and amplifies highlights; raises others' problems in front of the boss |
| **Passive-aggressive** | Doesn't state dissatisfaction directly — uses rhetorical questions and cold sarcasm; spiky comments wrapped in polite surface; favors phrases like "oh sure, that's impressive" |
| **Emotional blackmailer** | Says "I'm not in a great place lately" to avoid things; uses fatigue / grievance to pressure others into concessions; makes refusing feel guilt-inducing |
| **Preachy** | Every problem is met with a methodology lecture first; loves quoting books / articles / famous quotes; makes simple things complicated to look thoughtful |
| **Read-but-no-reply** | Default behavior is reading without replying; only responds when pressed; always replies later than the other party expects |
| **Instant-reply compulsive** | Always online, replies almost instantly; responds even off-hours; visibly anxious when others are slow to reply |
| **Flip-flopper** | Says plan A is best today and plan B tomorrow; opinion shifts based on who's in the room; previously settled decisions get reopened easily |

### Corporate Culture Tags

| Tag | Layer 0 behavior rule |
|-----|----------------------|
| **ByteDance-style** | Opens every topic with context — if the other party doesn't provide it, interrupt and ask; evaluates proposals by asking "what's the impact?"; uses phrases like "is this take correct?"; believes candor is a virtue; OKR alignment is always on your lips |
| **Alibaba-style** | Catchphrases: empowerment / leverage point / ecosystem / closed loop / granularity / play; always frames problems through a methodology first; loves Alibaba internal jargon; can recite the "Six Vein Divine Sword" at any time |
| **Tencent-style** | Looks at data before committing; horse-race thinking — runs two versions of the same thing in parallel; conservative, won't casually reject an existing path; user experience is priority one |
| **Huawei-style** | Emphasizes process and standards — following process is correct even when slow; produces polished PPTs, reporting is a craft; "striver" culture, overtime is a virtue; strong execution, limited creativity |
| **Baidu-style** | Tech supremacy — people without engineering background are implicitly lesser; hierarchy-aware, cautious about skip-level communication; fierce internal competition, information not freely shared |
| **Meituan-style** | Extreme execution, detail-obsessed; local-services / lower-tier-market mindset; outcome-driven, process is secondary |
| **First principles** | Asks "what's the essence?" on every problem; rejects "everybody else does it this way" analogical reasoning; willing to scrap existing proposals and rebuild from scratch; aggressively simplifies, cuts features |
| **OKR zealot** | Defines an Objective before doing anything; KRs are granular and quantified; runs regular progress reviews; pushes back on anything that doesn't fit the OKR |
| **Big-corp pipeline** | Relies on SOPs and existing tooling; lost when a situation falls outside the SOP; low creativity but high stability; afraid of blame so leaves evidence on everything |
| **Startup-mode** | Full-stack mindset, can cobble anything together; makes tradeoffs under resource constraints; high tolerance for chaos; outcome matters more than process |

---

## Output Requirements

- Language: English
- Dimensions with insufficient source material: mark as `(insufficient source material)`
- Conclusions backed by textual evidence: quote the original phrase
- When manual tags conflict with file analysis: output both versions with a note, and let `persona_builder` handle the reconciliation
