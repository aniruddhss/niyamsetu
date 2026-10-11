import fs from "node:fs";
import pg from "pg";
import { pipeline } from "@huggingface/transformers";

for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required in the server-side environment.");

const MODEL_ID = "Xenova/multilingual-e5-small";
const EXPECTED_DIMENSIONS = 384;
const PASSAGE_PREFIX = "passage: ";
const BATCH_SIZE = 16;

const extractor = await pipeline("feature-extraction", MODEL_ID, { dtype: "fp32" });
const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

let embedded = 0;
try {
  await client.query("update rule_chunks set embedding = null, embedding_model = null, embedding_created_at = null where embedding_model is distinct from $1", [MODEL_ID]);
  for (;;) {
    const { rows } = await client.query(
      "select id, chunk_text from rule_chunks where embedding is null order by rule_number, chunk_index limit $1",
      [BATCH_SIZE],
    );
    if (rows.length === 0) break;

    const output = await extractor(rows.map((row) => PASSAGE_PREFIX + row.chunk_text), { pooling: "mean", normalize: true });
    const vectors = output.tolist();
    if (vectors[0].length !== EXPECTED_DIMENSIONS) {
      throw new Error(`Model returned ${vectors[0].length} dimensions; expected ${EXPECTED_DIMENSIONS}.`);
    }

    await client.query("begin");
    try {
      for (let i = 0; i < rows.length; i += 1) {
        await client.query(
          `update rule_chunks
             set embedding = $1, embedding_model = $2, embedding_created_at = now(),
                 metadata = metadata || '{"embedding_status":"done"}'::jsonb
           where id = $3`,
          [`[${vectors[i].join(",")}]`, MODEL_ID, rows[i].id],
        );
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
    embedded += rows.length;
    console.log(`Embedded ${embedded} chunks so far.`);
  }
  console.log(`Done. Embedded ${embedded} chunks with ${MODEL_ID}.`);
} finally {
  await client.end();
}
