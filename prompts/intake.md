# Basic Info Intake Script

## Opening Line

```
I'll help you create a Skill for this colleague. Just 3 questions — you can skip any of them.
```

---

## Question Sequence

### Q1: Alias / codename

```
How do you want to address this colleague? (Alias, nickname, or codename — all fine. Join multiple words with a hyphen.)

Example: qing-yun
```

- Accepts any string
- The generated slug uses `-` as separator (never underscores)
- Chinese names are auto-converted to pinyin and joined with `-` (e.g. a two-character name like "Qing Yun" → `qing-yun`)
- English names are lowercased and joined with `-` ("Big Mike" → `big-mike`)

---

### Q2: Basic info

Company, level, role, and gender go in a single question so the user can answer in one sentence:

```
Describe their basic info in one sentence — company, level, role, gender. Say whatever comes to mind, or skip.

Example: ByteDance 2-1 backend engineer male
```

Parse the following fields from the user's answer (leave blank if missing):
- **Company**
- **Level**
- **Role**
- **Gender**

#### Level Reference Table

| Company | Format | Engineer / IC | Senior | Expert | Staff / Principal |
|---------|--------|---------------|--------|--------|-------------------|
| ByteDance | X-Y | 2-1, 2-2 | 3-1, 3-2 | 3-3 | 3-3+ (O-level) |
| Alibaba | P | P5, P6 | P7 | P8 | P9+ |
| Tencent | T | T1-1~T2-2 | T3-1, T3-2 | T4 | T4+ |
| Baidu | T | T5, T6 | T7 | T8 | T9+ |
| Meituan | P | P4, P5 | P6 | P7 | P8+ |
| Huawei | numeric | 13–15 | 16–17 | 18–19 | 20–21 |
| NetEase | P | P1–P3 | P4 | P5 | P6+ |
| JD | T | T3–T4 | T5 | T6 | T7+ |
| Xiaomi | numeric | 1–3 | 4–5 | 6–7 | 8+ |

**Rough cross-company mapping**:

```
ByteDance 2-1/2-2  ≈  Alibaba P6   ≈  Tencent T2    ≈  Baidu T6
ByteDance 3-1      ≈  Alibaba P7   ≈  Tencent T3-1  ≈  Baidu T7
ByteDance 3-2      ≈  Alibaba P7+  ≈  Tencent T3-2
ByteDance 3-3      ≈  Alibaba P8   ≈  Tencent T4
```

> Note: ByteDance 2-1 is the engineer title; 3-1 and up are senior engineers.
> 2-1 is roughly Alibaba P6 — a strong IC who can independently ship work.

---

### Q3: Personality profile

MBTI, zodiac, personality tags, corporate culture tags, and subjective impression all go into one open-ended question:

```
Describe their personality in one sentence — MBTI, zodiac, traits, corporate culture, and
your impression of them. Say whatever comes to mind, or skip.

Example: INTJ Capricorn blame-shifter ByteDance-style very strict in CR but never explains why
```

From the user's answer, identify and extract the following fields (leave blank if missing):
- **MBTI**: one of the 16 standard types
- **Zodiac**: one of the 12 signs
- **Personality tags**: match against the library below; custom descriptions also accepted
- **Corporate culture tags**: match against the library below
- **Subjective impression**: anything that doesn't fit a category — preserve verbatim

#### Personality Tag Library

**Work attitude**: Responsible / Good-enough / Blame-shifter / Scapegoat / Perfectionist / Procrastinator

**Communication style**: Direct / Roundabout / Quiet / Talkative / Voice-note lover / Read-but-no-reply / Read-and-reply-nonsense / Instant-reply compulsion

**Decision style**: Decisive / Flip-flopper / Defers to management / Forceful / Data-driven / Gut-feel

**Emotional style**: Stable / Thin-skinned / Easily excited / Cold and distant / Outwardly agreeable / Passive-aggressive

**Tactics and maneuvers**: PUA master / Office politician / Blame-shifting artist / Managing-up expert / Preachy / Emotional blackmailer

#### Corporate Culture Tag Library

- **ByteDance-style** — candid and direct, impact-obsessed, always prefaces with "context", loves saying "align"
- **Alibaba-style** — "Six Vein Divine Sword" values, loves jargon like "empowerment", "leverage point", "ecosystem", "closed loop"
- **Tencent-style** — data-driven, horse-race mentality, measured and conservative, user-experience-focused
- **Huawei-style** — "striver" culture, process-focused, loves PPT reports, emphasizes execution
- **Baidu-style** — tech-supremacy, hierarchy-aware, fierce internal competition
- **Meituan-style** — extreme execution, detail-obsessed, local-services mindset
- **First principles** — Musk-style, always asks for the essence, rejects analogical reasoning, aggressively simplifies
- **OKR zealot** — starts every conversation with "what's the Objective", obsesses over KRs
- **Big-corp pipeline** — well-processed but low-creativity, SOP-reliant, afraid of blame
- **Startup-mode** — limited resources, full-stack mindset, outcome-driven, tolerant of chaos

---

## Confirmation Summary

After collection, display:

```
Summary:

  👤  {alias}
  🏢  {company} {level} {role}  (omit if blank)
  ⚧   {gender}                  (omit if blank)
  🧠  {MBTI} {zodiac}            (omit if blank)
  🏷️   Personality: {tag list}  (omit if blank)
  🏢  Culture: {tag list}       (omit if blank)
  💬  Impression: {free text}   (omit if blank)

Confirm? (confirm / edit [field])
```

Once confirmed, proceed to Step 2 file import.
