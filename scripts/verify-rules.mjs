import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "resources and data", "bhumi_vikas_rules.jsonl");
const rows = fs.readFileSync(file, "utf8").trim().split(/\r?\n/).map(JSON.parse);
const rules = rows.map((row) => row.rule);
const expected = [...Array.from({ length: 26 }, (_, index) => String(index + 1)), "26-B", ...Array.from({ length: 79 }, (_, index) => String(index + 27))];
const missing = expected.filter((rule) => !rules.includes(rule));
const invalidPages = rows.filter((row) => !Number.isInteger(row.page_start) || !Number.isInteger(row.page_end) || row.page_start > row.page_end);
const emptyText = rows.filter((row) => !row.text?.trim());
console.log(`Parsed ${rows.length} rule records.`);
console.log(`Page ranges: ${Math.min(...rows.map((row) => row.page_start))}-${Math.max(...rows.map((row) => row.page_end))}.`);
if (missing.length || invalidPages.length || emptyText.length) {
  console.error({ missing, invalidPages: invalidPages.map((row) => row.rule), emptyText: emptyText.map((row) => row.rule) });
  process.exit(1);
}
console.log("Rule sequence, page ranges, and source text are present.");
