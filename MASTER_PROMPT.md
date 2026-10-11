# MASTER_PROMPT.md
## Bhumi Vikas Sahayak: Bilingual Building-Rules Assistant

You are working inside an **already initialized Next.js repository**. Build the product described in this document directly in the existing codebase. Do not create a separate project or replace the existing setup without a clear technical reason.

Your job is to deliver a usable, polished, minimal single-user interface for a municipal building-permission clerk in Bhopal, Madhya Pradesh. The clerk asks questions about the MP Bhumi Vikas Rules, receives a concise evidence-grounded answer, opens the exact source passage, and downloads a report containing the answer and supporting evidence.

**Initial stack:** Next.js App Router, TypeScript, Tailwind CSS, and Supabase (Postgres + `pgvector`). Do **not** introduce FastAPI initially. Keep server-side retrieval and database access inside Next.js server code. Structure the code so a Python service could be added later only if there is a demonstrated need.

---

## 1. Product principles

1. **One workflow, one primary user.** This is a focused clerk tool, not a government ERP, citizen portal, or multi-role administration system.
2. **Bilingual by design.** Hindi and English must both be supported throughout the interface, query templates, prompts, answers, errors, source metadata, and report exports.
3. **Evidence before confidence.** Every factual answer about a rule must cite a retrieved source. Never invent rule numbers, page numbers, fees, setbacks, floors, or legal requirements.
4. **Show uncertainty honestly.** If the source does not answer the question, or retrieval is weak or conflicting, say that the available source does not establish the answer. Ask for missing required inputs when appropriate.
5. **The source remains authoritative.** The tool supports the clerk; it does not make the official decision or present its output as legal advice.
6. **Keep the UI quiet and efficient.** Prioritize readable typography, whitespace, keyboard accessibility, clear hierarchy, and a fast path from question to evidence.
7. **No unsupported claims about current law.** The supplied rule data is consolidated through 6 March 2025 and the project brief says it does not include the 28 August 2026 amendment to Rule 2(5)(c). Do not label it “latest/current” unless verified amendment data has been incorporated and its provenance recorded. Display the source version and limitations clearly.

## 2. Start by inspecting the repository

Before editing:
- Inspect `package.json`, app structure, existing components, styling conventions, and installed dependencies.
- Reuse the current framework, package manager, linting, and component conventions.
- Do not overwrite existing work blindly.
- If Supabase is not configured, add setup instructions and `.env.example` with placeholder names only.
- Do not place secrets or service-role keys in client code or commit real credentials.
- Build in small coherent steps and ensure the app runs, type-checks, and lints using the repository's available scripts.

## 3. Main user experience

Build a **single primary workspace** with these regions:

### A. Header
- Product name: **Bhumi Vikas Sahayak**.
- Compact source/version status, such as “Source: consolidated to 6 Mar 2025” plus a clear note that the August 2026 amendment is not yet included unless it has been verified and loaded.
- Hindi / English language switch.
- The language switch must update all interface labels and default response language, not merely the placeholder.
- Do not imply the selected language is the language of the source document.

### B. Start / empty state
- Clear prompt explaining that the clerk can ask a question about building rules.
- Search/chat input with submit button.
- Suggested questions as one-click examples.
- Show examples in both languages and allow switching language.
- Suggested questions should be grounded in the supplied sample questions when those data are available. If no question data is available, use generic examples and mark them as examples, not verified answers.

### C. Query templates
Add fast templates for:
1. Setback requirements.
2. Permitted floors and building limits.
3. Fees and charges.
4. Requirement lookup by topic or rule number.
5. Check a proposed building case.

When a template is selected, show a small, accessible form with only relevant fields. Provide Hindi and English labels. Clearly distinguish required from optional inputs. Do not invent a legal formula or claim a field is mandatory unless that requirement is supported by the rule or domain configuration.

Potential inputs, depending on the template:
- Plot area (square metres).
- Road width (metres).
- Plot/use category.
- Proposed building or construction details.
- Topic or rule number.
- Application type and fee-related parameters required by the source.
- Additional relevant details.

Do not make assumptions for empty fields. On submit, either ask the clerk for missing inputs that are required for a meaningful answer or perform a general rule lookup and clearly state what could not be determined.

### D. Conversation area
For each user question:
- Show the question and a concise answer in the selected language.
- Show a clear status: “Answer supported by source”, “Insufficient information”, “Not found in available rules”, or “Needs review” with bilingual equivalents.
- Show rule number, source title, source version/effective date when known, PDF page number, and an expandable exact excerpt.
- Make source references clickable so they open the source viewer at the cited page and passage.
- Allow follow-up questions with prior conversation context, but re-run retrieval for each new factual claim.
- Preserve the original source language and indicate when the excerpt is translated. Never label a machine-generated translation as an exact official quotation.
- Provide actions to copy the answer, download the answer, open highlighted evidence, and download the evidence report.
- Diagram generation is optional and secondary. Do not let it delay or clutter the primary answer workflow.

### E. Source viewer and exact-source highlighter
Implement a source viewer that shows the **actual source text**, not AI-rewritten text, with the matched span highlighted.

- Keep stable source identifiers and page boundaries during ingestion.
- Each citation should carry source document ID, source version ID, rule ID, PDF page number, exact excerpt, and, where available, offsets or a stable chunk/span identifier.
- For a text viewer, render the stored excerpt and highlight the exact matched phrase/span using stored offsets or deterministic text matching.
- If the original PDF is available, provide an “Open original PDF at page” action. Browser PDF page fragments may be used where supported, but do not claim that arbitrary text highlighting inside a PDF is reliable across all viewers.
- If the official PDF's Hindi text cannot be extracted correctly because of legacy font encoding, do not fabricate a searchable official Hindi transcript. Use verified Hindi source text only when available; otherwise show the verified English excerpt with a clear language label and optionally a clearly labelled translation.
- The highlighted content must come from stored source material, never from a model-generated citation.
- If a matching passage cannot be found exactly, do not render a false highlight. Show the source page and state that exact span highlighting is unavailable.

### F. Recent queries
- Show recent queries for the current browser session or local session, without requiring sign-in.
- A clerk can reopen a previous query and its response if the underlying data is still available.
- Do not persist sensitive personal data. The intended dataset is public and contains no personal data.
- If implementing session persistence, keep it lightweight and document its behavior. Do not create a complex user-management system.

### G. Downloadable answer and evidence report
**The evidence bundle/report is an important feature, not an afterthought.**

Provide a one-click **Download evidence report** action after an answer. Generate a clean, print-ready PDF report. If PDF generation is not practical within the existing stack, implement a well-formatted print view as a fallback and document the limitation.

The report should include:
- Product name and report generation date/time.
- Original user question.
- Answer in the language used for the response.
- Answer status and any limitations or missing information.
- Every cited rule number and title.
- Source document title and source version/consolidation date.
- PDF page numbers.
- Exact source excerpt(s), preserving original wording and clearly identifying the source language.
- A visible indication of the highlighted passage, such as a highlighted excerpt block or marked text.
- A note that the report is an aid for reference and that the clerk must verify applicability and make the official decision.
- If the answer relies on a translation, label it as a translation and include the original source excerpt where available.
- Do not include unsupported facts or citations that were not part of the answer's retrieved evidence.

Use a server-side or client-side PDF library compatible with the current repository, based on existing dependencies and build compatibility. Keep exports deterministic and testable. Use proper Unicode-capable fonts for Hindi in PDFs; verify Devanagari rendering rather than assuming it works. If Hindi PDF text rendering cannot be made reliable in the time available, provide a downloadable HTML/print report with Unicode support and explain the fallback.

Also provide:
- Copy answer.
- Download answer as a simple text or Markdown file.
- Optional download of the source excerpt or evidence report.
- Optional diagram export in SVG/PNG, with rule citations carried into the diagram or its accompanying notes.

### H. Optional diagram generation
- Offer a button only after an answer exists.
- Generate a simple, black-and-white, low-level flowchart or decision diagram using the complete relevant conversation context and retrieved rule evidence.
- Keep diagrams small, readable, and free of decoration.
- Diagram content must not introduce legal requirements not present in the retrieved source.
- Include source rule references in the diagram or accompanying notes.
- Provide a downloadable SVG or PNG, and optionally include it in the evidence report.
- If rendering fails, preserve the answer and report functionality.

---

## 4. Retrieval and answer-generation behavior

### A. Ingestion
Build a repeatable ingestion script or server-side ingestion utility for the supplied rule data. Prefer the provided structured JSONL dataset where available. Keep the original PDFs as source artifacts.

For each rule/chunk, preserve:
- Stable rule ID and displayed rule number.
- Rule title and part/section where available.
- Full original text.
- Source document ID and version ID.
- Original PDF page range and page references.
- Source language.
- Content type (prose/table/amendment/footnote where known).
- Original source metadata and provenance.
- Embedding model identifier and embedding generation timestamp.
- Exact text used to produce the embedding.

Do not flatten critical numeric tables into ambiguous prose. Store tables or table rows in a structured form when possible, including headers, units, conditions, and footnotes. Keep deterministic calculations in ordinary TypeScript functions, not in the language model.

### B. Retrieval
Implement retrieval behind a server-only module with a stable interface. Start with Supabase Postgres and `pgvector`, combined with Postgres full-text search. Use hybrid retrieval where feasible:
1. Normalize the query without losing numbers, units, rule IDs, Hindi characters, or punctuation that could matter.
2. Detect or accept the query language.
3. Search exact rule numbers and key phrases.
4. Run full-text retrieval.
5. Run vector similarity retrieval.
6. Combine and rank results; prefer exact rule-number matches and relevant structured table data.
7. Apply source-version filters and retain metadata.
8. Return source chunks with stable citation identifiers and exact text.

Do not silently rely on vector similarity alone for numeric/legal questions. Where useful, search for both Hindi and English terms, but do not pretend the official Hindi source was parsed if it was not.

### C. Answer generation
Use a provider-neutral server-side LLM adapter so the model provider can be configured without rewriting retrieval. Read API keys only from server-side environment variables. Never expose them in client bundles.

System instructions to the answer model:
- Answer in the user's selected language or the language of the question.
- Be concise and directly address the question.
- Use only retrieved evidence for factual rule claims.
- Cite each material claim with a rule number and source page.
- Separate source facts, calculations, assumptions, and unknowns.
- If evidence is missing, conflicting, outdated, or insufficient, explicitly state this.
- Never invent rules, fees, numeric limits, effective dates, or citations.
- Ask for missing required inputs when necessary.
- For calculations, call deterministic code with validated inputs and cite the source of the formula/parameters.
- Do not describe the result as a binding legal decision or legal advice.
- Return a structured response object, validated with a schema, containing:
  - `answer`
  - `language`
  - `status`
  - `citations[]`
  - `missingInputs[]`
  - `calculations[]` where relevant
  - `limitations[]`
  - `retrievalMetadata` for diagnostics where appropriate.

If no LLM key is configured, the application should still support source search and display relevant source passages without pretending a generated answer was produced.

### D. Confidence and “not found”
Do not rely on a model's self-reported confidence as the sole basis for deciding whether a rule exists. Use retrieval signals and explicit evidence checks. When no sufficiently relevant evidence is retrieved:
- Show “Not found in available rules”.
- Present the best available next action, such as searching by rule number or trying a different phrase.
- Do not provide an unsupported guess.
If evidence exists but required plot/case details are missing:
- Show “Insufficient information”.
- Ask only for the fields that are necessary to proceed.
If evidence conflicts or version applicability is uncertain:
- Show “Needs review”.
- Present the conflicting sources or the version limitation.

---

## 5. Supabase database design

Use Supabase Postgres. Add versioned SQL migrations to the repository, for example under `supabase/migrations/`. Adapt naming to the existing project if a migration convention already exists.

### A. `source_documents`
Stores original source document metadata.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `source_url text`
- `source_language text not null` (`en`, `hi`, etc.)
- `document_type text not null` (rulebook, amendment, supporting document)
- `published_at date`
- `consolidated_through date`
- `effective_from date`
- `effective_to date null`
- `version_label text not null`
- `is_verified boolean not null default false`
- `verification_notes text`
- `created_at timestamptz not null default now()`

### B. `rules`
Stores a stable record for each rule, independent of individual document versions where practical.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `rule_number text not null`
- `title text`
- `part text`
- `created_at timestamptz not null default now()`
- Unique constraint on normalized rule number if appropriate, without assuming inserted rule labels are always simple integers.

### C. `rule_versions`
Stores the version-specific rule content.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `rule_id uuid not null references rules(id)`
- `source_document_id uuid not null references source_documents(id)`
- `source_rule_number text not null`
- `full_text text not null`
- `source_language text not null`
- `pdf_page_start integer`
- `pdf_page_end integer`
- `content_type text not null default 'prose'`
- `is_amendment boolean not null default false`
- `effective_from date`
- `effective_to date`
- `verified boolean not null default false`
- `created_at timestamptz not null default now()`
- Unique constraints should prevent accidental duplicate imports for the same rule/document/version.

### D. `rule_chunks`
Stores retrieval chunks with source anchors.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `rule_version_id uuid not null references rule_versions(id) on delete cascade`
- `source_document_id uuid not null references source_documents(id)`
- `rule_number text not null`
- `chunk_index integer not null`
- `chunk_text text not null`
- `source_language text not null`
- `pdf_page integer`
- `page_start_offset integer`
- `page_end_offset integer`
- `char_start integer`
- `char_end integer`
- `content_type text not null default 'prose'`
- `search_vector tsvector`
- `embedding vector(<dimension>)` only after choosing the embedding provider/model and confirming its vector dimensions
- `embedding_model text`
- `embedding_created_at timestamptz`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- Unique constraint on `(rule_version_id, chunk_index)`.

Use an appropriate full-text configuration for English and a deliberate strategy for Hindi. Do not assume English stemming or tokenization works well for Devanagari. Exact phrase, substring, and metadata searches may be needed for Hindi.

### E. `rule_tables` (recommended)
Stores structured rule tables when extracted.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `rule_version_id uuid not null references rule_versions(id) on delete cascade`
- `source_document_id uuid not null references source_documents(id)`
- `rule_number text not null`
- `table_title text`
- `headers jsonb not null`
- `rows jsonb not null`
- `footnotes jsonb not null default '[]'::jsonb`
- `pdf_page_start integer`
- `pdf_page_end integer`
- `verified boolean not null default false`
- `created_at timestamptz not null default now()`

Store numeric values with their units and conditions. Never claim an unverified table extraction is authoritative.

### F. Optional `query_feedback`
Stores simple feedback if enabled.

Suggested columns:
- `id uuid primary key default gen_random_uuid()`
- `session_id text`
- `query_text text not null`
- `answer_status text`
- `feedback_type text not null` (`correct`, `incorrect`, `needs_review`)
- `comment text`
- `created_at timestamptz not null default now()`

Do not collect personal or sensitive data. Feedback must not be required for the core workflow.

### G. Session and recent-query storage
For the first version, prefer client-side session state for recent queries and chat context. Do not introduce accounts or authentication solely to save a query history. If persistent query history is later added, define its retention, privacy, and access policy explicitly.

### H. Indexes and retrieval functions
- Add indexes for foreign keys and frequent filters.
- Add a GIN index for `search_vector` where used.
- Add vector index (HNSW or IVFFlat) only when the chosen embedding model and data size justify it.
- Implement a server-callable hybrid retrieval function or combine ranked queries in server-only TypeScript.
- Use parameterized queries and Supabase RPC functions where appropriate.
- Do not store API keys in database rows.
- Do not use the Supabase service-role key in browser code.
- Enable Row Level Security on tables exposed through Supabase APIs. Keep privileged ingestion and writes server-only. If the app is intentionally a trusted local/demo deployment without sign-in, document the access model instead of pretending public anonymous access is secure.

### I. Embedding dimensions
Do not guess vector dimensions. Choose the embedding provider/model, confirm its output dimension, then create the vector column and matching RPC signature. Document how to re-embed if the model changes. If embeddings are not yet configured, ship keyword/exact search first with a clean retrieval interface, and mark vector search as requiring setup rather than silently returning fake results.

---

## 6. Suggested project structure

Adapt this to the existing repository rather than forcing an exact structure.

```text
app/
  page.tsx
  layout.tsx
  api/
    query/route.ts
    report/route.ts
    diagram/route.ts        # optional
components/
  chat/
  query-templates/
  source-viewer/
  evidence-report/
  ui/
lib/
  i18n/
  supabase/
    client.ts
    server.ts
  retrieval/
    index.ts
    keyword-search.ts
    hybrid-search.ts
    citations.ts
  answer/
    generate-answer.ts
    schema.ts
  reports/
    generate-report.ts
  diagrams/                 # optional
  validation/
supabase/
  migrations/
scripts/
  ingest-rules.ts           # or Python ingestion script, if the repo already supports it
  verify-ingestion.ts
tests/
  retrieval/
  citations/
  templates/
  reports/
```

Keep Supabase admin/service credentials and all model API keys in server-only modules. Never import server-only modules into client components.

---

## 7. API and validation behavior

Implement a small number of server routes or server actions, following existing project conventions.

### Query endpoint
- Validate the query, language, template ID, structured fields, and conversation context.
- Set reasonable length limits and handle empty inputs.
- Retrieve evidence before answer generation.
- Return a schema-validated result with citations and status.
- Do not accept client-supplied citations as trusted evidence.
- Use server-side rate limits or other basic abuse protection appropriate to the deployment.
- Handle missing environment variables gracefully.

### Report endpoint
- Accept only a validated answer payload and source references that can be re-resolved against trusted database records.
- Re-fetch the source excerpts server-side rather than trusting arbitrary text supplied by the client.
- Include only evidence associated with the query result.
- Escape HTML and handle Unicode safely.
- Do not include secrets, internal prompts, or irrelevant conversation content.

### Diagram endpoint (optional)
- Generate from relevant conversation context plus retrieved evidence.
- Validate output before rendering.
- Treat model-generated Mermaid or SVG as untrusted input. Do not inject arbitrary model-provided SVG or HTML into the page without sanitization.
- Fail independently without breaking chat or evidence reports.

---

## 8. Internationalization and Hindi requirements

Hindi support must be functional, not decorative.

- Use a central translation dictionary or the project's existing i18n solution for all UI text.
- Use proper Devanagari-capable fonts and test common Windows and Android rendering.
- Support Hindi input, Unicode normalization where safe, punctuation, and mixed Hindi-English queries.
- Do not transliterate user questions automatically unless the user requests it.
- Preserve numerals, units, rule numbers, hyphens, parentheses, and identifiers during normalization.
- Generate answers in the selected language.
- Provide bilingual empty states, validation errors, loading states, no-result messages, evidence labels, download labels, and report disclaimers.
- Preserve the original text of cited source passages. A translated explanation must be clearly labelled as a translation.
- Test downloadable reports for Hindi text extraction, glyph rendering, copy/paste, and print output.
- Do not promise a verified Hindi legal citation unless the Hindi source text itself has been checked.

---

## 9. UI and accessibility quality bar

- Minimal, high-quality layout with no unnecessary dashboard chrome.
- Responsive on desktop and tablet sizes suitable for a counter workspace.
- Keyboard navigation, visible focus states, accessible labels, and semantic buttons.
- Enter submits; Shift+Enter adds a newline.
- Keep focus sensible when switching templates, opening evidence, and showing validation errors.
- Loading states should explain whether the system is searching, preparing the answer, or creating a report.
- Errors should be actionable and bilingual.
- Do not use decorative charts, gamification, or unnecessary animations.
- Use clear labels instead of unexplained technical terms such as “embedding” or “vector similarity” in the clerk-facing UI.

---

## 10. Required tests and acceptance criteria

Add tests using the repository's existing test setup. If no test framework exists, choose a small compatible one and document it.

The build is acceptable only when:

1. A clerk can ask in English and receive an English response.
2. A clerk can ask in Hindi and receive a Hindi response.
3. UI labels, templates, validation, errors, source labels, and reports work in both languages.
4. Each factual answer contains one or more citations, or explicitly says no supported answer was found.
5. Every citation maps to a real database source record, rule, version, and page when that metadata exists.
6. Source highlighting only occurs when the stored source text matches the highlighted span.
7. If exact matching fails, the app reports that limitation instead of fabricating a highlight.
8. Suggested questions populate the input correctly.
9. Each query template opens a working form and validates its inputs.
10. Missing inputs are requested instead of being silently guessed.
11. Recent queries can be reopened for the current session.
12. The answer can be copied and downloaded.
13. The evidence report includes the question, answer, status, source version, rule numbers, page numbers, exact excerpts, limitations, and disclaimer.
14. Hindi text renders correctly in the selected report format, or the app uses the documented Unicode-safe print/HTML fallback.
15. The source-version limitation is visible and not contradicted by answer text.
16. The application works without a model API key in source-search mode and does not pretend to generate AI answers.
17. Numeric table values and calculations are checked against the original PDF before being represented as verified.
18. No secrets are committed or exposed to client bundles.
19. Existing lint, type-check, and build commands pass.
20. README setup steps explain Supabase setup, migrations, ingestion, environment variables, supported functionality, and known limitations.

Create tests for:
- English query retrieval.
- Hindi and mixed-language query retrieval.
- Exact rule-number lookup.
- No-result behavior.
- Missing-input behavior.
- Citation integrity.
- Source span highlighting.
- Report generation with English and Hindi text.
- Rule version and amendment warnings.
- Numeric/table extraction verification status.

Do not claim an accuracy percentage unless it has actually been measured against the supplied sample questions and the results are recorded.

---

## 11. Environment configuration

Create or update `.env.example` using placeholder values only. Use the names appropriate to the repository, such as:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_PROVIDER=
EMBEDDING_API_KEY=
EMBEDDING_MODEL=
```

Keep `SUPABASE_SERVICE_ROLE_KEY`, LLM keys, and embedding keys server-only. Do not expose them via `NEXT_PUBLIC_` variables. If the project uses Supabase publishable keys rather than legacy anon keys, follow the installed SDK's current convention.

Document which variables are required for:
- keyword search,
- vector search,
- AI answer generation,
- report export.

The app should fail gracefully when an optional provider is not configured.

---

## 12. Implementation sequence

Build in this order and keep the app runnable at every step:

1. Inspect the repository and confirm existing framework conventions.
2. Create the bilingual shell, language toggle, chat input, suggested questions, and templates.
3. Add Supabase setup, migrations, and source-version metadata.
4. Build ingestion and verification for the provided JSONL and source PDFs.
5. Implement exact rule lookup and keyword search first.
6. Add embeddings and `pgvector` hybrid retrieval after selecting a real embedding model and confirming dimensions.
7. Implement grounded answers and schema-validated citations.
8. Implement source viewer and exact-span highlighting.
9. Add session-based recent queries.
10. Implement answer downloads and the evidence report with reliable Hindi support.
11. Add optional monochrome diagram generation and export.
12. Run tests, lint, type-check, and production build; fix errors.
13. Update README with setup instructions and a truthful feature/limitation list.

Do not build fake functionality merely to make the interface look complete. Where a provider or source file is unavailable, show a clear setup state and keep other working features functional.

---

## 13. Final deliverables

When finished, provide:
- Working code in the existing repository.
- Supabase migrations.
- Ingestion and verification scripts.
- `.env.example`.
- Tests for retrieval, citations, bilingual behavior, and reports.
- A concise README with setup and run instructions.
- A summary of what works, what requires credentials or additional verified data, and what remains incomplete.

**Definition of done:** A clerk can ask a rule question in Hindi or English, receive a concise source-grounded response, inspect the exact cited passage, and download a bilingual-safe evidence report. If the available source cannot support the answer, the product says so clearly instead of guessing.
