import fs from "node:fs";
import path from "node:path";

export type SourceRecord = {
  id: string;
  rule: string;
  title: string;
  part: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  sourceLanguage: "en";
  sourceTitle: string;
};

type DatasetRow = { rule: string; title: string; part: string; page_start: number; page_end: number; text: string };

const dataPath = path.join(process.cwd(), "resources and data", "bhumi_vikas_rules.jsonl");
const sourceTitle = "M.P. Bhumi Vikas Rules, 2012 — consolidated to 6 March 2025";

function cleanText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/^\s*Rule\s+[\w-]+\s+M\.P\. Bhumi Vikas Rules, 2012\s+\d+\s*$/gim, "")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function loadRecords(): SourceRecord[] {
  try {
    if (!fs.existsSync(dataPath)) return [];
    return fs.readFileSync(dataPath, "utf8").split("\n").filter(Boolean).map((line) => {
    const row = JSON.parse(line) as DatasetRow;
    return {
      id: `mpbvr-rule-${row.rule.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      rule: `Rule ${row.rule}`,
      title: row.title,
      part: row.part,
      pageStart: row.page_start,
      pageEnd: row.page_end,
      text: cleanText(row.text),
      sourceLanguage: "en",
      sourceTitle,
    };
    });
  } catch (error) {
    console.error("Source dataset failed to load.", error instanceof Error ? error.name : "unknown");
    return [];
  }
}

export const sourceRecords = loadRecords();

const synonyms: Record<string, string[]> = {
  setback: ["open space", "setback", "margins"],
  सेटबैक: ["open space", "setback"],
  सड़क: ["road", "access", "means of access"],
  "सड़क चौड़ाई": ["road", "width", "access"],
  भवन: ["building", "construction", "development"],
  मंजिल: ["floor", "storey", "height"],
  मंज़िल: ["floor", "storey", "height"],
  शुल्क: ["fee", "charge", "application"],
  आवेदन: ["application", "permission"],
  अनुमति: ["permission", "approval"],
  आवासीय: ["residential", "dwelling"],
  आवास: ["residential", "dwelling"],
};

function normalizedTerms(query: string) {
  const normalized = query.toLocaleLowerCase("en-IN");
  const terms = new Set(normalized.split(/[^\p{L}\p{N}-]+/u).filter((term) => term.length > 1));
  for (const [term, expansions] of Object.entries(synonyms)) if (normalized.includes(term)) expansions.forEach((expansion) => terms.add(expansion));
  return [...terms];
}

function exactRule(query: string) {
  const match = query.match(/(?:rule|नियम)\s*([0-9]+(?:-[a-z])?)/i) ?? query.match(/\b([0-9]+-[a-z])\b/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function scoreRecord(record: SourceRecord, query: string, templateId?: string) {
  const lowerText = `${record.rule} ${record.title} ${record.part} ${record.text}`.toLocaleLowerCase("en-IN");
  const terms = normalizedTerms(query);
  let score = 0;
  const rule = exactRule(query);
  if (rule && record.rule.toLowerCase().replace("rule ", "") === rule) score += 100;
  if (lowerText.includes(query.toLocaleLowerCase("en-IN"))) score += 20;
  for (const term of terms) if (lowerText.includes(term)) score += term.length > 3 ? 3 : 1;
  if (templateId === "setback" && /open space|setback|margin/.test(lowerText)) score += 10;
  if (templateId === "floors" && /storey|floor|height/.test(lowerText)) score += 10;
  if (templateId === "fees" && /fee|charge|application/.test(lowerText)) score += 10;
  return score;
}

function excerptFor(record: SourceRecord, query: string) {
  const text = record.text;
  const terms = normalizedTerms(query).filter((term) => term.length > 3);
  const lower = text.toLocaleLowerCase("en-IN");
  const matchIndex = terms.map((term) => lower.indexOf(term)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, text.lastIndexOf("\n", Math.max(0, matchIndex - 240)) + 1);
  const excerpt = text.slice(start, start + 760).trim();
  return excerpt.length < text.length ? `${excerpt}…` : excerpt;
}

export function searchSources(query: string, templateId?: string) {
  return sourceRecords
    .map((record) => ({ record, score: scoreRecord(record, query, templateId) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ record }) => ({ ...record, excerpt: excerptFor(record, query) }));
}
