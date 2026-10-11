# Bhumi Vikas Sahayak

**A bilingual (Hindi / English) assistant for building-permission clerks working under the Madhya Pradesh Bhumi Vikas Rules, 2012.**

Ask a question about building rules, get a short answer, check the exact source passage it comes from, and download a report with the answer and its evidence. Every rule-based answer is tied to a retrieved source. The tool supports the clerk's decision; it does not make the decision.

---

## Features

- **Ask in Hindi or English.** The language switch changes the whole interface and the answer language.
- **Evidence-first answers.** Each answer shows the rule number, title, PDF page, and an expandable exact excerpt from the official text.
- **Clear status on every answer.** "Supported by source", "Insufficient information", "Not found in available rules", or "Needs review".
- **Query templates.** Guided forms for setbacks, permitted floors and limits, fees, rule lookup by topic or number, and checking a proposed building case.
- **Rule 56 site-plan figures.** For residential buildings up to 12.5 m high, the app works out front and rear open-space requirements from plot area and road width. These come from fixed tables in code, not from the AI. It also shows an SVG site plan that can be downloaded.
- **Downloadable evidence report.** A print-ready HTML report with the answer, sources, limitations, and disclaimer. Print it to PDF from the browser.
- **Recent queries.** Reopen earlier questions from the current browser session. Nothing is stored after the session ends, and no sign-in is needed.
- **Works without an AI key.** Source search and exact passages are available even when no answer model is configured.

## What it covers, and what it does not

- **Source:** The MP Bhumi Vikas Rules, 2012, consolidated up to **6 March 2025**. The dataset has 106 records (Rules 1 to 105 plus Rule 26-B).
- **Not included:** The 28 August 2026 amendment to Rule 2(5)(c). The app does not describe the rules as "latest" or "current".
- **English text is searchable.** The Hindi PDF is kept as a source file, but a verified searchable Hindi transcript is not in the dataset. Hindi questions are answered from the English text, and the app says so.
- **Not legal advice.** Answers are reference material for the clerk. Confirm against the official gazette before acting on them.

## Getting started

You need Node.js 22 and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app works without any credentials.

## Optional setup

To enable more features, copy `.env.example` to `.env.local` and fill in the values you need.

| Feature | Settings needed |
|---|---|
| Claude-written answers | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| Database-backed search | Supabase URL and publishable key, plus the database migration and `npm run ingest:data` |
| Semantic search | Embeddings generated with `npm run embed:data` (not yet connected to live queries) |

Keep service-role keys and database passwords on the server only. Never commit `.env.local`.

## Checking the data

```bash
npm run verify:data
```

This confirms the bundled rule dataset is complete and well formed.

## Project documents

- [MASTER_PROMPT.md](./MASTER_PROMPT.md): full product brief, behaviour rules, and acceptance criteria.
- [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md): production-readiness checklist.
- `resources and data/`: the source PDFs (English and Hindi), the structured rule file, and a data dictionary.

## Limitations

- Exact-passage highlighting depends on stored text. If a passage cannot be matched exactly, the app shows the page and says highlighting is not available.
- Keyword search is the active retrieval method. Semantic search is prepared but not yet used for live answers.
- The site-plan figures cover Rule 56 only, for residential buildings up to 12.5 m high. Taller buildings are not calculated.
- The app is for a single clerk's use. It has no user accounts or multi-user administration.
