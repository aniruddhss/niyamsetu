import Anthropic from "@anthropic-ai/sdk";

type Evidence = { rule: string; title: string; pageStart: number; pageEnd: number; excerpt: string };

export async function generateClaudeAnswer(query: string, language: "en" | "hi", evidence: Evidence[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey || !model || evidence.length === 0) return null;

  const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });
  const evidenceText = evidence.map((item) => `[${item.rule}, PDF pages ${item.pageStart}-${item.pageEnd}] ${item.excerpt}`).join("\n\n");
  try {
    const response = await client.messages.create({
      model,
      max_tokens: 500,
      system: "You answer municipal building-rule questions. Use only the supplied evidence. Never invent numbers, formulas, legal requirements, citations, or current-law claims. If the evidence is insufficient, say so. Do not make an official decision or give legal advice. Keep the answer concise. Do not add markdown citations; the application attaches trusted citations separately.",
      messages: [{ role: "user", content: `Answer in ${language === "hi" ? "Hindi" : "English"}.\nQuestion: ${query}\n\nRetrieved evidence:\n${evidenceText}` }],
    });
    return response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n").trim() || null;
  } catch (error) {
    console.error("Claude answer generation failed; falling back to source-only mode.", error instanceof Error ? error.name : "unknown");
    return null;
  }
}
