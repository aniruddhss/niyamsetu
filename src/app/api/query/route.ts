import { searchSources } from "@/lib/source-data";
import { searchSupabaseSources } from "@/lib/retrieval/supabase-search";
import { generateClaudeAnswer } from "@/lib/answer/claude";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 1000) : "";
  const language = body.language === "hi" ? "hi" : "en";
  const templateId = ["setback", "floors", "fees"].includes(body.templateId) ? body.templateId : undefined;
  const localRecords = query ? searchSources(query, templateId) : [];
  const remoteRecords = query ? await searchSupabaseSources(query) : [];
  const records = remoteRecords.length ? remoteRecords : localRecords;
  const bilingual = language === "hi";
  const status = records.length ? "supported" : "not-found";
  const generatedAnswer = records.length ? await generateClaudeAnswer(query, language, records) : null;
  const answer = generatedAnswer || (records.length
    ? bilingual
      ? `उपलब्ध स्रोत में ${records[0].rule} — ${records[0].title} इस प्रश्न से सबसे अधिक संबंधित है। स्रोत अंश में दिया गया नियम देखें; यह उत्तर उपलब्ध पाठ और पृष्ठ-संदर्भ तक सीमित है। लागू तालिका, शर्तों और प्रस्तावित केस की अलग से समीक्षा आवश्यक है।`
      : `The retrieved source most directly related to this question is ${records[0].rule} — ${records[0].title}. See the cited passage below; this answer is limited to the available text and page reference. Review the applicable tables, conditions, and proposed case separately.`
    : bilingual
      ? "उपलब्ध सत्यापित स्रोत अंश इस प्रश्न का उत्तर स्थापित नहीं करते। किसी नियम संख्या, विषय या संबंधित केस विवरण के साथ फिर से खोजें।"
      : "The available verified source passages do not establish an answer to this question. Try a rule number, topic, or the relevant case details.");
  return Response.json({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: query,
    answer,
    status,
    citations: records.map((record) => ({ ...record, page: record.pageStart })),
    limitations: records.length
      ? bilingual
        ? ["स्रोत पाठ अंग्रेज़ी PDF से लिया गया है; हिन्दी PDF उपलब्ध है, लेकिन उसका सत्यापित searchable transcript इस dataset में नहीं है।", "स्रोत सेट 6 मार्च 2025 तक consolidated है; 28 अगस्त 2026 का संशोधन शामिल नहीं है।"]
        : ["The searchable source text is from the English PDF; the Hindi PDF is available, but a verified searchable Hindi transcript is not included in this dataset.", "The source set is consolidated to 6 March 2025; the 28 August 2026 amendment is not included."]
      : [],
    createdAt: new Date().toISOString(),
  });
}
