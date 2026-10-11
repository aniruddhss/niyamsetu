# Bhumi Vikas Sahayak — Production Readiness Checklist

Use this checklist before calling the project production-ready. Check items only after recording evidence in the final column or attaching a test artifact.

## 1. Local baseline

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | `npm install` completes without unresolved dependency errors | Packages installed; Node 20 emits a Supabase engine warning. Upgrade runtime to Node 22 before deployment. |
| [x] | `npm run verify:data` passes | 106 records, Rules 1–105 plus 26-B, pages 2–109. |
| [x] | `npx tsc --noEmit` passes | Verified locally. |
| [x] | `npm run lint` passes | Verified locally. |
| [x] | `npm run build` passes | Verified locally. |
| [ ] | Production server starts with `npm start` | Test after deployment build. |
| [ ] | No uncommitted secrets, `.env.local`, passwords, or service-role keys | Run secret scanning before release. |
| [ ] | Node.js deployment runtime is 22+ | Required by current Supabase JS packages. |

## 2. Environment and configuration

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | `NEXT_PUBLIC_SUPABASE_URL` configured | Supabase project URL present locally. |
| [x] | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured | Publishable key is browser-safe. |
| [ ] | `SUPABASE_SERVICE_ROLE_KEY` configured only in server/ingestion environment | Never expose it to client bundles. |
| [ ] | `DATABASE_URL` configured only for migrations and ingestion | Use a direct or session-pooler URL; never send it to the browser. |
| [ ] | `ANTHROPIC_API_KEY` configured server-side | Required for Claude-generated answers. |
| [ ] | `ANTHROPIC_MODEL` is set to an available Claude model | Test with one English and one Hindi query. |
| [ ] | `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, and `EMBEDDING_DIMENSIONS` agree | Current schema expects 384 dimensions for `Supabase/gte-small`. |
| [ ] | Production secrets are stored in the hosting provider secret manager | Do not commit `.env.local`. |
| [ ] | Separate development/staging/production Supabase projects or schemas exist | Avoid testing migrations against production. |

## 3. Supabase database and migrations

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | Migration includes `vector` extension | See `supabase/migrations/0001_source_schema.sql`. |
| [x] | `source_documents`, `rules`, `rule_versions`, and `rule_chunks` exist in migration | Confirm in Supabase Table Editor or SQL. |
| [x] | `rule_chunks.embedding` uses 384 dimensions | Must match the configured embedding model. |
| [x] | HNSW cosine index is defined | Confirm index exists after migration. |
| [x] | `match_rule_chunks` RPC is defined | Execute a test vector query. |
| [x] | RLS is enabled | Confirm all four source tables. |
| [x] | Read policies require verified source rows where appropriate | Test with publishable key. |
| [ ] | `npx supabase db push` succeeds against staging | Record migration output. |
| [ ] | Migration succeeds on a clean Supabase project | Catch hidden dependency/order issues. |
| [ ] | `npm run ingest:data` succeeds against staging | Confirm all 106 rules are inserted. |
| [ ] | Re-running ingestion is idempotent | No duplicate source/rule/version/chunk rows. |
| [ ] | Ingestion rollback behavior is tested | Interrupt or use a staging failure test. |
| [ ] | Database backups and restore procedure are documented and tested | Include restore owner and recovery target. |

## 4. Source data and citations

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | All supplied JSONL rows parse | `npm run verify:data`. |
| [x] | Rule order is complete | Rules 1–105 plus 26-B. |
| [x] | Page ranges are valid | Pages 2–109. |
| [x] | English source text is preserved | JSONL and bundled English PDF. |
| [x] | Hindi PDF is not falsely represented as searchable transcript | Limitation is shown in the response. |
| [ ] | Every ingested citation maps to a real database chunk | Run citation-integrity test. |
| [ ] | Every displayed page number matches the original PDF | Spot-check Rules 2, 12, 26-B, 29, 56, and 105. |
| [ ] | Numeric table values are checked against the PDF | Record reviewer and verification date. |
| [ ] | Amendment footnotes are retained and understandable | Check rules containing amendment markers. |
| [ ] | Source-version limitation is visible in UI and reports | Confirm 6 Mar 2025 and Aug 2026 exclusion. |
| [ ] | Source PDFs are available in the deployed source-viewing workflow | Test original PDF/page opening. |

## 5. Retrieval and RAG

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | Local exact rule-number retrieval works | Test `Rule 26-B`, `Rule 56`, and `नियम 29`. |
| [x] | Local keyword retrieval works | Test setback, fees, floors, access, and residential. |
| [x] | Hindi topic expansion exists | Confirm Hindi queries find English source passages. |
| [x] | No-result behavior avoids unsupported answers | Confirm `not-found` status. |
| [x] | Supabase retrieval falls back safely when database is unavailable | Test with invalid staging URL. |
| [x] | Claude receives retrieved evidence only | Inspect server adapter and test logs without exposing secrets. |
| [ ] | Supabase retrieval is preferred when verified chunks are populated | Confirm API response source metadata. |
| [ ] | Semantic embeddings are generated for every chunk | No `embedding_status: pending` rows remain. |
| [ ] | Vector RPC returns relevant results | Test at least 10 representative queries. |
| [ ] | Hybrid ranking prefers exact rule-number matches | Compare exact lookup against semantic matches. |
| [ ] | Claude answers contain no unsupported numeric claims | Human-review a representative query set. |
| [ ] | Claude failure falls back to source-only mode | Disable API key and verify graceful behavior. |
| [ ] | Request length, timeout, and rate limits are enforced | Test oversized and repeated requests. |
| [ ] | Prompt injection in source text and user input is handled | Verify model stays grounded in retrieved evidence. |

## 6. Bilingual interface

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | English interface labels work | Manual UI test. |
| [x] | Hindi interface labels work | Manual UI test. |
| [x] | Language toggle changes labels and query behavior | Test before and after submitting a query. |
| [ ] | English query returns English Claude answer | Requires `ANTHROPIC_API_KEY`. |
| [ ] | Hindi query returns Hindi Claude answer | Requires `ANTHROPIC_API_KEY`. |
| [ ] | Mixed Hindi-English query preserves rule numbers and units | Test `12 मीटर road Rule 29`. |
| [ ] | Devanagari input, copy, and display are correct on Windows and Android | Record browser/device versions. |
| [ ] | Hindi evidence report renders and copies correctly | Test generated HTML/print-to-PDF. |
| [ ] | Translation is clearly labeled and never shown as official quotation | Review answer/report wording. |

## 7. User workflow and accessibility

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | Suggested questions populate the input | Manual UI test. |
| [x] | All five templates open | Manual UI test. |
| [x] | Empty and no-result states are visible | Manual UI test. |
| [x] | Recent queries persist for the current browser session | Manual UI test. |
| [x] | Answer copy and text download exist | Manual UI test. |
| [x] | Evidence report download exists | Manual UI test. |
| [ ] | Enter submits and Shift+Enter creates a newline | Keyboard test. |
| [ ] | All controls have visible focus states | Keyboard-only test. |
| [ ] | Screen reader labels are meaningful | Test with NVDA/VoiceOver. |
| [ ] | Color contrast meets WCAG AA | Run axe or Lighthouse. |
| [ ] | Layout works at tablet and desktop widths | Test 768px, 1024px, and 1440px. |
| [ ] | Loading, timeout, and server-error states are actionable | Simulate slow/failing API. |

## 8. Reports and evidence integrity

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | Answer text download includes question, answer, citations, and disclaimer | Manual inspection. |
| [x] | Evidence report includes source title, page, excerpt, and limitation | Manual inspection. |
| [ ] | Report re-resolves evidence server-side | Required before accepting arbitrary client payloads in production. |
| [ ] | HTML report escapes user/model text | Add automated XSS test. |
| [ ] | Report contains no secret, prompt, or internal metadata | Inspect generated output. |
| [ ] | Hindi report prints correctly to PDF | Test Chrome and Edge print workflows. |
| [ ] | Failed report generation does not break answer display | Simulate download failure. |

## 9. Security and privacy

| Done | Check | Evidence / notes |
|---|---|---|
| [x] | `.env*` is gitignored | Confirm with `git status` and secret scan. |
| [x] | Service-role and database keys are server-only by convention | Review imports and environment names. |
| [x] | No personal data is collected by default | Dataset is public rules data. |
| [ ] | Supabase RLS policies are reviewed by a second person | Record approval. |
| [ ] | API route validates input and rejects oversized payloads | Add automated route tests. |
| [ ] | Rate limiting or abuse protection is enabled | Configure at hosting/API layer. |
| [ ] | Security headers and HTTPS are enabled | Verify deployment response headers. |
| [ ] | Dependency vulnerabilities are reviewed | Resolve or document `npm audit` findings. |
| [ ] | Logging redacts user queries where required | Review provider and hosting logs. |
| [ ] | Incident response and key rotation procedure exists | Test rotation without downtime. |

## 10. Deployment and monitoring

| Done | Check | Evidence / notes |
|---|---|---|
| [ ] | Staging deployment is live | Record URL and commit SHA. |
| [ ] | Production build runs on Node 22+ | Verify runtime logs. |
| [ ] | Production environment variables are present | Verify names only, never print values. |
| [ ] | Supabase migrations run in CI/CD or an approved release step | Record migration order. |
| [ ] | Health check covers `/` and `/api/query` | Add uptime monitor. |
| [ ] | Error monitoring is configured | Capture route, database, and Claude failures. |
| [ ] | Latency and token usage are monitored | Set budget alerts for Claude. |
| [ ] | Database size, connections, and vector index health are monitored | Review Supabase metrics. |
| [ ] | Rollback procedure is tested | Deploy a known-good previous commit. |
| [ ] | Owner and on-call contact are documented | Add team contact. |

## 11. Acceptance test pack

Run these end-to-end before release and attach screenshots or response fixtures:

1. English exact lookup: `What does Rule 12 say about permission?`
2. Hindi topic lookup: `सेटबैक और खुले स्थान की आवश्यकता क्या है?`
3. Mixed query: `Rule 56 residential building road width`
4. Exact special rule: `Rule 26-B`
5. No-result query: `What is the rule for a topic not present in the source?`
6. Template flow: choose setback, enter road width and plot area, submit.
7. Evidence flow: expand citation, inspect excerpt, verify page against PDF.
8. Session flow: submit query, refresh, reopen it from Recent queries.
9. Report flow: copy answer, download text, download evidence report, print to PDF.
10. Provider failure: remove Claude key and confirm source-search mode remains honest.
11. Database failure: make Supabase unavailable and confirm local fallback/error behavior.
12. Security flow: submit HTML/script text and verify it is escaped and not executed.

## Release decision

The project is production-ready only when every unchecked item that applies to the chosen deployment is either completed or explicitly waived by the project owner with a written reason. In particular, do not release until Supabase migration/ingestion, embeddings, Claude credentials, rate limiting, Hindi report rendering, and citation-integrity tests have been verified in staging.
