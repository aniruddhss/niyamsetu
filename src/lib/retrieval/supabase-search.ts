import { createClient } from "@/../utils/supabase/server";
import { embedQuery } from "@/lib/retrieval/embed-query";

type RemoteChunk = { id: string; rule_number: string; chunk_text: string; pdf_page: number | null; source_document_id: string };

const MATCH_COUNT = 8;

export async function searchSupabaseSources(query: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return [];
  try {
    const supabase = await createClient();
    const ruleMatch = query.match(/(?:rule|नियम)\s*([0-9]+(?:-[a-z])?)/i)?.[1];
    let data: RemoteChunk[] | null = null;

    if (ruleMatch) {
      const { data: exact, error } = await supabase
        .from("rule_chunks")
        .select("id,rule_number,chunk_text,pdf_page,source_document_id")
        .eq("rule_number", ruleMatch)
        .limit(MATCH_COUNT);
      if (!error && exact?.length) data = exact as RemoteChunk[];
    }

    if (!data) {
      const queryEmbedding = await embedQuery(query);
      if (queryEmbedding) {
        const { data: semantic, error } = await supabase.rpc("match_rule_chunks", {
          query_embedding: JSON.stringify(queryEmbedding),
          match_count: MATCH_COUNT,
        });
        if (!error && semantic?.length) data = semantic as RemoteChunk[];
      }
    }

    if (!data) {
      const terms = query.split(/\s+/).map((term) => term.replace(/[^\p{L}\p{N}-]/gu, "")).filter((term) => term.length > 2).slice(0, 5);
      if (!terms.length) return [];
      const { data: keyword, error } = await supabase
        .from("rule_chunks")
        .select("id,rule_number,chunk_text,pdf_page,source_document_id")
        .ilike("chunk_text", `%${terms[0]}%`)
        .limit(MATCH_COUNT);
      if (error || !keyword) return [];
      data = keyword as RemoteChunk[];
    }

    return data.map((row) => ({
      id: row.id,
      rule: `Rule ${row.rule_number}`,
      title: "Retrieved source passage",
      part: "",
      pageStart: row.pdf_page ?? 0,
      pageEnd: row.pdf_page ?? 0,
      excerpt: row.chunk_text,
      text: row.chunk_text,
      sourceLanguage: "en" as const,
      sourceTitle: "M.P. Bhumi Vikas Rules — Supabase source record",
    }));
  } catch {
    return [];
  }
}
