# colleague-agent

> *"You AI guys are traitors to the codebase — you've already killed frontend, now you're coming for backend, QA, ops, infosec, chip design, and eventually yourselves and all of humanity"*

A Next.js 15 (App Router) web app that turns uploaded source material about a
colleague — chat exports, profile docs, knowledge files — into a downloadable
Claude Code agent package. The app walks the user through a five-page wizard
(basic info → profile/chat → knowledge → review persona → download), runs a
multi-step Claude Sonnet 4.6 analysis pipeline server-side, ingests the
knowledge corpus into a RAG MCP, and assembles a framework-agnostic zip ready
to drop into a Claude Code project.

This is a **dev/demo-phase** build maintained. Storage is
the local filesystem (no database). The deployment target is Fly.io with a
mounted 1 GB volume at `/data/`.


## What's This
This project is learned from another interesting [colleague-skill](https://github.com/titanwings/colleague-skill) project.

You work with a colleague — a senior developer, a tech lead, a PM — who has years of context in their head: how they make decisions, how they communicate, what they know about the codebase, how they approach problems. When you need their input and they're not available, that context is locked away.

The original [colleague-skill](https://github.com/titanwings/colleague-skill) project tried to solve this by distilling a colleague into a single monolithic "Skill" file — a long markdown document that mixes personality, domain knowledge, work methods, and behavioral rules into one blob. It works, but poorly: the AI loads the entire file into context, personality rules compete with technical knowledge for attention, the file balloons as you add more source material, and the AI gets confused about whether it's supposed to sound like the colleague or follow a technical process.

**The Agent Package is a better answer.** Instead of one overloaded file, it separates the colleague into three clean layers — each doing one thing well — and lets the AI compose them naturally at runtime.


## Local development

Prerequisites: Node.js 20+ and pnpm.

```bash
pnpm install
cp .env.example .env   # then fill in the values below
pnpm dev               # http://localhost:3000
```

Required environment variables in `.env`:

```
LLM_BASE_URL=https://api.anthropic.com/v1
LLM_MODEL=claude-sonnet-4-6
LLM_API_KEY=<your-anthropic-key>
DATA_DIR=./data/colleagues
MAX_FILE_BYTES=20971520
MAX_TOTAL_UPLOAD_BYTES=104857600
RAG_INGEST_URL=https://rag-chatbot-v3-production.up.railway.app/ingest/text
```

Useful scripts:

```bash
pnpm test            # vitest run
pnpm lint            # next lint
pnpm build           # production build (standalone output)
pnpm start           # serve the production build locally
npx tsc --noEmit     # type-check only
```


