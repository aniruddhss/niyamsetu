import fs from "node:fs";
import path from "node:path";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required. Use the direct connection or session pooler string only in this server-side script.");

const sourceDir = path.join(process.cwd(), "resources and data");
const rows = fs.readFileSync(path.join(sourceDir, "bhumi_vikas_rules.jsonl"), "utf8").trim().split(/\r?\n/).map(JSON.parse);
const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query("begin");
  const versionLabel = "2012-consolidated-2025-03-06";
  const existingSource = await client.query("select id from source_documents where version_label = $1", [versionLabel]);
  const sourceDocumentId = existingSource.rows[0]?.id ?? (await client.query(
    `insert into source_documents (title, source_url, source_language, document_type, consolidated_through, version_label, is_verified, verification_notes)
     values ($1, $2, 'en', 'rulebook', '2025-03-06', $3, true, $4)
     returning id`,
    ["M.P. Bhumi Vikas Rules, 2012", "https://mptownplan.gov.in/NewsPDF/bvn06032025E.pdf", versionLabel, "Imported from the supplied JSONL and checked against the bundled English PDF."],
  )).rows[0].id;

  for (const row of rows) {
    const ruleResult = await client.query(
      `insert into rules (rule_number, title, part) values ($1, $2, $3)
       on conflict (rule_number) do update set title = excluded.title, part = excluded.part returning id`,
      [row.rule, row.title, row.part],
    );
    const ruleId = ruleResult.rows[0].id;
    const versionResult = await client.query(
      `insert into rule_versions (rule_id, source_document_id, source_rule_number, full_text, source_language, pdf_page_start, pdf_page_end, verified)
       values ($1, $2, $3, $4, 'en', $5, $6, true)
       on conflict (rule_id, source_document_id) do update set full_text = excluded.full_text, pdf_page_start = excluded.pdf_page_start, pdf_page_end = excluded.pdf_page_end, verified = true
       returning id`,
      [ruleId, sourceDocumentId, row.rule, row.text, row.page_start, row.page_end],
    );
    const versionId = versionResult.rows[0].id;
    await client.query("delete from rule_chunks where rule_version_id = $1", [versionId]);
    const chunkSize = 1800;
    for (let start = 0, index = 0; start < row.text.length; start += chunkSize, index += 1) {
      const chunk = row.text.slice(start, start + chunkSize);
      await client.query(
        `insert into rule_chunks (rule_version_id, source_document_id, rule_number, chunk_index, chunk_text, source_language, pdf_page, char_start, char_end, metadata)
         values ($1, $2, $3, $4, $5, 'en', $6, $7, $8, $9)`,
        [versionId, sourceDocumentId, row.rule, index, chunk, row.page_start, start, start + chunk.length, JSON.stringify({ title: row.title, part: row.part, embedding_status: "pending", source_file: "bhumi_vikas_rules.jsonl" })],
      );
    }
  }
  await client.query("commit");
  console.log(`Ingested ${rows.length} rules from the supplied JSONL dataset.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
