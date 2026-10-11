"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FRONT_RULE, REAR_RULE, type SitePlanResult } from "@/lib/site-plan/setbacks";
import { renderSitePlanSvg } from "@/lib/site-plan/svg";

type Language = "en" | "hi";
type Status = "supported" | "not-found";
type Citation = {
  id: string;
  rule: string;
  title: string;
  page: number;
  excerpt: string;
  sourceLanguage: "en" | "hi";
  sourceTitle: string;
};
type Result = {
  id: string;
  question: string;
  answer: string;
  status: Status;
  citations: Citation[];
  limitations: string[];
  sitePlan?: SitePlanResult | null;
  createdAt: string;
};
type Template = { id: string; label: string; query: string };

const SOURCE_NOTE = "Consolidated to 6 Mar 2025. 28 Aug 2026 amendment not included.";
const HISTORY_KEY = "niyamsetu-history";

const copy = {
  en: {
    title: "Bhumi Vikas Sahayak",
    intro: "Ask a question about Madhya Pradesh building rules. Answers cite the exact source passage.",
    placeholder: "e.g. What is the setback for a 12 m road?",
    ask: "Ask",
    asking: "Searching…",
    templates: "Quick templates",
    examples: "Sample questions to test",
    summary: "Summary",
    evidence: "Sources",
    limitations: "Limitations",
    recent: "Recent",
    supported: "Answer supported by source",
    notFound: "Not found in available rules",
    copy: "Copy answer",
    copied: "Copied",
    download: "Download text",
    report: "Download report",
    print: "Print / save as PDF",
    disclaimer: "Reference aid only. Verify applicability before making an official decision.",
    page: "Page",
    notice: "This is a reference aid, not a statement of current law. Confirm the applicable version.",
    sitePlan: "Site plan",
    downloadSvg: "Download SVG",
    planCaption: "Schematic, drawn from the computed setbacks; plot assumed square. Side open spaces (Rule 56(3)) not drawn.",
    figures: "Computed open spaces",
    inputs: "Read from your question",
    front: "Front open space",
    rear: "Rear open space",
    plotArea: "Plot area",
    roadWidth: "Road width",
    height: "Building height",
    notGiven: "not given",
    nil: "Nil",
  },
  hi: {
    title: "भूमि विकास सहायक",
    intro: "मध्य प्रदेश भवन नियमों के बारे में प्रश्न पूछें। उत्तर सटीक स्रोत अंश के साथ दिए जाते हैं।",
    placeholder: "उदाहरण: 12 मीटर सड़क के लिए सेटबैक कितना है?",
    ask: "पूछें",
    asking: "खोज रहे हैं…",
    templates: "त्वरित टेम्पलेट",
    examples: "परीक्षण के लिए नमूना प्रश्न",
    summary: "सारांश",
    evidence: "स्रोत",
    limitations: "सीमाएं",
    recent: "हाल के प्रश्न",
    supported: "उत्तर स्रोत से समर्थित है",
    notFound: "उपलब्ध नियमों में नहीं मिला",
    copy: "उत्तर कॉपी करें",
    copied: "कॉपी हो गया",
    download: "टेक्स्ट डाउनलोड करें",
    report: "रिपोर्ट डाउनलोड करें",
    print: "प्रिंट / PDF के रूप में सेव करें",
    disclaimer: "केवल संदर्भ सहायता। आधिकारिक निर्णय से पहले लागू नियम सत्यापित करें।",
    page: "पृष्ठ",
    notice: "यह वर्तमान कानून का दावा नहीं है। लागू संस्करण की पुष्टि करें।",
    sitePlan: "साइट प्लान",
    downloadSvg: "SVG डाउनलोड करें",
    planCaption: "सांकेतिक चित्र, नाप के अनुसार नहीं। साइड की खाली जगह (नियम 56(3)) नहीं दिखाई गई।",
    figures: "गणना की गई खुली जगह",
    inputs: "आपके प्रश्न से लिया गया",
    front: "सामने की खुली जगह",
    rear: "पीछे की खुली जगह",
    plotArea: "प्लॉट क्षेत्रफल",
    roadWidth: "सड़क की चौड़ाई",
    height: "भवन की ऊंचाई",
    notGiven: "नहीं दिया गया",
    nil: "शून्य",
  },
} as const;

const templates: Record<Language, Template[]> = {
  en: [
    { id: "setback", label: "Setback", query: "What are the setback (open space) requirements for a building?" },
    { id: "floors", label: "Floors and height", query: "What is the maximum number of floors and height allowed?" },
    { id: "fees", label: "Fees and application", query: "What fees and application requirements apply to building permission?" },
  ],
  hi: [
    { id: "setback", label: "सेटबैक", query: "भवन के लिए सेटबैक (खुला स्थान) की आवश्यकताएं क्या हैं?" },
    { id: "floors", label: "मंजिल और ऊंचाई", query: "अधिकतम कितनी मंजिलें और ऊंचाई अनुमत है?" },
    { id: "fees", label: "शुल्क और आवेदन", query: "भवन अनुमति के लिए कौन-से शुल्क और आवेदन की आवश्यकता है?" },
  ],
};

const examples: Record<Language, string[]> = {
  en: [
    "What is the setback for a 12 m road?",
    "What is the rule for a 9 m plot?",
    "Show Rule 29 source passage",
    "What information is needed to check a case?",
  ],
  hi: [
    "12 मीटर सड़क के लिए सेटबैक कितना है?",
    "9 मीटर प्लॉट के लिए नियम क्या है?",
    "नियम 29 का स्रोत अंश दिखाएं",
    "केस जांचने के लिए कौन-सी जानकारी चाहिए?",
  ],
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const t = copy[language];
  const planRef = useRef<HTMLDivElement>(null);
  const sitePlan = result?.sitePlan ?? null;
  const planSvg = useMemo(() => (sitePlan ? renderSitePlanSvg(sitePlan) : null), [sitePlan]);
  const showPlan = Boolean(sitePlan && (planSvg || sitePlan.note));

  useEffect(() => {
    let stored: Result[] = [];
    try {
      stored = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      stored = [];
    }
    queueMicrotask(() => setHistory(stored));
  }, []);

  async function submit(event?: FormEvent, overrideQuery?: string, overrideTemplate?: string) {
    event?.preventDefault();
    const text = overrideQuery ?? query;
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, language, templateId: overrideTemplate ?? templateId }),
      });
      const data = (await response.json()) as Result;
      setResult(data);
      const next = [data, ...history.filter((item) => item.id !== data.id)].slice(0, 6);
      setHistory(next);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer() {
    if (!result) return;
    await navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function downloadText() {
    if (!result) return;
    const text = [
      t.title,
      new Date(result.createdAt).toLocaleString(),
      "",
      result.question,
      "",
      result.answer,
      "",
      t.evidence,
      ...result.citations.map((c) => `${c.rule} · ${c.title} · ${t.page} ${c.page}\n${c.excerpt}`),
      "",
      t.disclaimer,
    ].join("\n");
    saveBlob(text, "text/plain;charset=utf-8", "bhumi-vikas-answer.txt");
  }

  function buildReportHtml() {
    if (!result) return "";
    const sources = result.citations
      .map(
        (c) =>
          `<section><h3>${escapeHtml(c.rule)} · ${escapeHtml(c.title)}</h3><p>${escapeHtml(c.sourceTitle)} · ${t.page} ${c.page}</p><blockquote>${escapeHtml(c.excerpt)}</blockquote></section>`,
      )
      .join("");
    const limitations = result.limitations.map(escapeHtml).join("<br>") || "—";
    return `<!doctype html><html lang="${language}"><meta charset="utf-8"><title>${escapeHtml(t.title)}</title><style>body{font:16px "Nirmala UI",Arial,sans-serif;max-width:760px;margin:40px auto;line-height:1.55;color:#111}blockquote{border-left:3px solid #999;padding:4px 14px;margin:10px 0;color:#333;white-space:pre-line}small{color:#666}</style><h1>${escapeHtml(t.title)}</h1><small>${escapeHtml(new Date(result.createdAt).toLocaleString())} · ${escapeHtml(SOURCE_NOTE)}</small><h2>${escapeHtml(result.question)}</h2><h3>${t.summary}</h3><p>${escapeHtml(result.answer)}</p><p><strong>${result.status === "supported" ? t.supported : t.notFound}</strong></p>${planSvg ? `<h2>${t.sitePlan}</h2>${planSvg}<p><small>${escapeHtml(t.planCaption)}</small></p>` : ""}<h2>${t.evidence}</h2>${sources}<h2>${t.limitations}</h2><p>${limitations}</p><p><small>${escapeHtml(t.disclaimer)}</small></p></html>`;
  }

  function downloadSvg() {
    const svg = planRef.current?.querySelector("svg");
    if (!svg) return;
    saveBlob(svg.outerHTML, "image/svg+xml", "site-plan.svg");
  }

  function downloadReport() {
    if (!result) return;
    saveBlob(buildReportHtml(), "text/html;charset=utf-8", "bhumi-vikas-report.html");
  }

  function printReport() {
    if (!result) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildReportHtml());
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-10 text-neutral-900">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t.intro}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-sm">
          {(["en", "hi"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={language === lang}
              className={`rounded px-3 py-1 ${language === lang ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
            >
              {lang === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
      </header>

      <p className="border-l-2 border-neutral-300 pl-3 text-sm text-neutral-600">{t.notice}</p>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.templates}</p>
        <div className="flex flex-wrap gap-2">
          {templates[language].map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              aria-pressed={templateId === tpl.id}
              onClick={() => {
                setTemplateId(tpl.id);
                setQuery(tpl.query);
                submit(undefined, tpl.query, tpl.id);
              }}
              className={`rounded-md border px-3 py-1.5 text-sm ${templateId === tpl.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-neutral-100"}`}
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="query-box" className="sr-only">
          {t.ask}
        </label>
        <textarea
          id="query-box"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t.placeholder}
          rows={3}
          className="w-full resize-none rounded-md border border-neutral-300 bg-white p-3 focus:border-neutral-900 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? t.asking : t.ask}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.examples}</p>
        <div className="flex flex-wrap gap-2">
          {examples[language].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setTemplateId(undefined);
                setQuery(example);
              }}
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <section
          className={`grid items-start gap-6 border-t border-neutral-200 pt-6 ${showPlan ? "min-[860px]:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]" : ""}`}
        >
          <div className="flex min-w-0 flex-col gap-6">
          <div>
            <p className="text-sm text-neutral-500">{result.question}</p>
            <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.summary}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{result.answer}</p>
            <p className={`mt-3 text-sm font-medium ${result.status === "supported" ? "text-green-800" : "text-amber-800"}`}>
              {result.status === "supported" ? t.supported : t.notFound}
            </p>
          </div>

          {sitePlan && showPlan && (
            <div className="flex flex-col gap-4">
              {(sitePlan.frontM !== null || sitePlan.rearM !== null) && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.figures}</h2>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {sitePlan.frontM !== null && (
                      <FigureTile label={t.front} value={`${sitePlan.frontM} m`} rule={FRONT_RULE} />
                    )}
                    {sitePlan.rearM !== null && (
                      <FigureTile label={t.rear} value={sitePlan.rearM === 0 ? t.nil : `${sitePlan.rearM} m`} rule={REAR_RULE} />
                    )}
                  </div>
                </div>
              )}
              {sitePlan.note && (
                <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{sitePlan.note}</p>
              )}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.inputs}</h2>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-neutral-500">{t.plotArea}</dt>
                  <dd>{sitePlan.plotAreaSqm !== null ? `${sitePlan.plotAreaSqm} sq m` : t.notGiven}</dd>
                  <dt className="text-neutral-500">{t.roadWidth}</dt>
                  <dd>{sitePlan.roadWidthM !== null ? `${sitePlan.roadWidthM} m` : t.notGiven}</dd>
                  <dt className="text-neutral-500">{t.height}</dt>
                  <dd>{sitePlan.heightM !== null ? `${sitePlan.heightM} m` : t.notGiven}</dd>
                </dl>
              </div>
            </div>
          )}

          {result.citations.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t.evidence}</h2>
              {result.citations.map((c) => (
                <details key={c.id} className="rounded-md border border-neutral-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    {c.rule} · {c.title} · {t.page} {c.page}
                  </summary>
                  <p className="mt-3 text-xs text-neutral-500">{c.sourceTitle}</p>
                  <blockquote className="mt-2 whitespace-pre-line border-l-2 border-neutral-300 pl-3 text-sm leading-relaxed text-neutral-800">
                    {c.excerpt}
                  </blockquote>
                </details>
              ))}
            </div>
          )}

          {result.limitations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t.limitations}</h2>
              <ul className="mt-2 list-inside list-disc text-sm text-neutral-700">
                {result.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={copyAnswer} className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100">
              {copied ? t.copied : t.copy}
            </button>
            <button type="button" onClick={downloadText} className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100">
              {t.download}
            </button>
            <button type="button" onClick={downloadReport} className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100">
              {t.report}
            </button>
            <button type="button" onClick={printReport} className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100">
              {t.print}
            </button>
          </div>
          <p className="text-xs text-neutral-500">{t.disclaimer}</p>
          </div>

          {showPlan && (
            <aside className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 min-[860px]:sticky min-[860px]:top-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t.sitePlan}</h2>
              {planSvg ? (
                <>
                  {/* SVG comes from the pure renderSitePlanSvg; all text inside it is escaped. */}
                  <div ref={planRef} className="[&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: planSvg }} />
                  <p className="text-xs text-neutral-600">{t.planCaption}</p>
                  <button type="button" onClick={downloadSvg} className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
                    {t.downloadSvg}
                  </button>
                </>
              ) : (
                <p className="text-sm text-neutral-700">{sitePlan?.note}</p>
              )}
            </aside>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="flex flex-col gap-2 border-t border-neutral-200 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t.recent}</h2>
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setResult(item)}
              className="truncate text-left text-sm text-neutral-700 hover:underline"
            >
              {item.question}
            </button>
          ))}
        </section>
      )}

      <footer className="mt-auto border-t border-neutral-200 pt-4 text-xs text-neutral-500">{SOURCE_NOTE}</footer>
    </main>
  );
}

function FigureTile({ label, value, rule }: { label: string; value: string; rule: string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-1 text-xs text-neutral-600">{rule}</p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch] ?? ch;
  });
}

function saveBlob(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
