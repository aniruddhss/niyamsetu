# Bhumi Vikas Sahayak

Evidence-first bilingual building-rules assistant for a municipal building-permission clerk in Bhopal.

## Run locally

```bash
npm install
npm run dev
```

The app runs without credentials. It parses the bundled `resources and data/bhumi_vikas_rules.jsonl` dataset at the server boundary, covering 106 records (Rules 1–105 plus Rule 26-B), with titles, parts, exact source text, and PDF page ranges. Retrieval combines exact rule-number lookup, English keyword search, Hindi-to-English topic expansion, and template hints. The report download is a Unicode-safe HTML file that can be printed to PDF from the browser.

Verify the supplied source data with:

```bash
npm run verify:data
```

## Setup for real source data

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase URL and publishable key. The publishable key is safe for browser use; keep the service-role key server-only.
3. Add the database password to `DATABASE_URL` using the Session pooler string on IPv4-only networks, or the direct connection string where available.
4. Apply the migration with `npx supabase db push` or your SQL migration workflow. The migration enables pgvector, creates the source tables, an HNSW cosine index, an RPC for vector matching, and read policies for verified source rows.
5. Ingest the supplied 106-rule dataset with `npm run ingest:data`. This inserts verified English source records and deterministic chunks; embeddings remain `pending` until an embedding provider is configured.
6. Add `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` to enable Claude-grounded answer generation. Claude is used only after retrieval and receives the retrieved excerpts; citations remain server-owned.

The current UI supports English/Hindi labels, session-only recent queries, exact stored excerpt display, no-result behavior, template forms, answer downloads, and evidence-report downloads. The supplied English transcript is searchable; the Hindi PDF is preserved as a source artifact but does not have a verified searchable transcript in the dataset. The app does not claim the August 2026 amendment is included. Supabase keyword retrieval and Claude answer generation are implemented; vector querying is ready through `match_rule_chunks`, while embedding generation must be connected to the selected provider before semantic retrieval is enabled.

For the current Next.js 16 app, the session refresher is implemented as `src/proxy.ts`; Next.js renamed the older `middleware.ts` convention to Proxy. Supabase helpers live in `utils/supabase/`.
