"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";

export type Language = "en" | "hi";
export type Status = "supported" | "not-found";

export type Citation = {
  id: string;
  rule: string;
  title: string;
  page: number;
  excerpt: string;
  sourceLanguage: "en" | "hi";
  sourceTitle: string;
};

export type Result = {
  id: string;
  question: string;
  answer: string;
  status: Status;
  citations: Citation[];
  limitations: string[];
  createdAt: string;
};

export type Template = {
  id: string;
  label: string;
  description: string;
  fields: {
    id: string;
    label: string;
    placeholder: string;
    unit?: string;
    type?: string;
  }[];
  buildQuery: (values: Record<string, string>) => string;
};

const SOURCE_NOTE = "Consolidated to 6 Mar 2025. 28 Aug 2026 amendment not included.";
const HISTORY_KEY = "niyamsetu-history";

const copy = {
  en: {
    productName: "NiyamSetu",
    productSubtitle: "Bhumi Vikas Sahayak",
    badgeOfficial: "MP Bhumi Vikas Rules, 2012",
    welcomePrompt: "What building rule would you like to check?",
    welcomeSubtext:
      "A calm, content-first reference assistant for municipal clerks and planners. Answers directly cite the consolidated official gazette.",
    placeholder: "Ask about setbacks, FAR, permissible floors, fees, or Rule 29…",
    shiftEnterHint: "Press Enter to send, Shift+Enter for new line",
    ask: "Ask",
    searching: "Searching rules…",
    commonTemplates: "Common query templates",
    hideTemplates: "Hide templates",
    openTemplateForm: "Configure query",
    generateFromForm: "Check rule requirements",
    cancelForm: "Cancel",
    suggestedQueries: "Suggested queries",
    recentQueries: "Recent queries",
    noRecent: "No queries yet in this session",
    clearHistory: "Clear history",
    newQuery: "New question",
    answerSummary: "Regulation Summary",
    evidenceHeader: "Verified Source Citations",
    evidenceSubtext: "Exact statutory passages matching your inquiry",
    limitations: "Scope & Limitations",
    supportedBadge: "Verified by official gazette",
    notFoundBadge: "Not found in available rules",
    copyAnswer: "Copy",
    copiedAnswer: "Copied",
    downloadTxt: "Export Text",
    downloadReport: "Download Evidence Report",
    printReport: "Print / Save PDF",
    openOriginalPdf: "Open Original PDF at Page",
    expandSource: "View full cited text",
    collapseSource: "Show less",
    disclaimer:
      "Official reference aid only. Cross-verify before issuing municipal sanctions or regulatory approvals.",
    statutoryNotice:
      "Reference aid consolidated to 6 March 2025. 28 August 2026 amendment is not included. Always confirm against the latest gazette notification.",
    pageLabel: "Page",
    closeSidebar: "Close sidebar",
    openSidebar: "Query history",
    highlightLabel: "Exact match in rule:",
    sourceDocLabel: "Document:",
    noResultsTip:
      "Try searching by specific rule number (e.g., 'Rule 29'), technical term (e.g., 'open spaces', 'podium', 'mezzanine'), or road width.",
  },
  hi: {
    productName: "नियमसेतु",
    productSubtitle: "भूमि विकास सहायक",
    badgeOfficial: "म.प्र. भूमि विकास नियम, 2012",
    welcomePrompt: "आप किस भवन नियम की जांच करना चाहते हैं?",
    welcomeSubtext:
      "नगर निगम क्लर्कों एवं योजनाकारों के लिए शांत, प्रामाणिक संदर्भ सहायक। सभी उत्तर समेकित राजपत्र नियमों के सीधे संदर्भ के साथ प्रस्तुत किए जाते हैं।",
    placeholder: "सेटबैक, एफ.ए.आर., अनुमत मंजिलें, शुल्क या नियम 29 के बारे में पूछें…",
    shiftEnterHint: "भेजने के लिए Enter दबाएं, नई पंक्ति के लिए Shift+Enter",
    ask: "पूछें",
    searching: "नियम खोज रहे हैं…",
    commonTemplates: "सामान्य नियम टेम्पलेट",
    hideTemplates: "टेम्पलेट छिपाएं",
    openTemplateForm: "नियम फॉर्म भरें",
    generateFromForm: "आवश्यकताएं जांचें",
    cancelForm: "रद्द करें",
    suggestedQueries: "सुझाए गए प्रश्न",
    recentQueries: "हाल के प्रश्न",
    noRecent: "इस सत्र में अभी कोई प्रश्न नहीं",
    clearHistory: "इतिहास हटाएं",
    newQuery: "नया प्रश्न",
    answerSummary: "नियम सारांश",
    evidenceHeader: "सत्यापित स्रोत साक्ष्य",
    evidenceSubtext: "आपके प्रश्न से संबंधित आधिकारिक राजपत्र अंश",
    limitations: "सीमाएं एवं दायरे",
    supportedBadge: "आधिकारिक राजपत्र से सत्यापित",
    notFoundBadge: "उपलब्ध नियमों में नहीं मिला",
    copyAnswer: "कॉपी",
    copiedAnswer: "कॉपी हो गया",
    downloadTxt: "टेक्स्ट डाउनलोड",
    downloadReport: "साक्ष्य रिपोर्ट डाउनलोड",
    printReport: "प्रिंट / PDF सेव करें",
    openOriginalPdf: "मूल PDF पृष्ठ खोलें",
    expandSource: "पूर्ण उद्धरण देखें",
    collapseSource: "संक्षिप्त करें",
    disclaimer:
      "केवल संदर्भ सहायता। आधिकारिक नगर निगम स्वीकृति से पूर्व मूल नियमों से अवश्य मिलान करें।",
    statutoryNotice:
      "समेकित संस्करण: 6 मार्च 2025 तक। 28 अगस्त 2026 का संशोधन शामिल नहीं है। लागू संस्करण की पुष्टि करें।",
    pageLabel: "पृष्ठ",
    closeSidebar: "साइडबार बंद करें",
    openSidebar: "हाल के प्रश्न",
    highlightLabel: "नियम में सटीक मिलान:",
    sourceDocLabel: "दस्तावेज़:",
    noResultsTip:
      "विशिष्ट नियम संख्या (उदा. 'नियम 29'), पारिभाषिक शब्द (जैसे 'खुला स्थान', 'सेटबैक', 'मंजिल') या सड़क चौड़ाई लिखकर खोजें।",
  },
} as const;

export const queryTemplates: Record<Language, Template[]> = {
  en: [
    {
      id: "setback",
      label: "Setback & Open Spaces",
      description: "Check front, rear, and side margin setbacks based on road width and plot size",
      fields: [
        { id: "roadWidth", label: "Road Width", placeholder: "e.g. 12", unit: "meters" },
        { id: "plotSize", label: "Plot Area / Depth", placeholder: "e.g. 150", unit: "sq.m / m" },
        { id: "buildingUse", label: "Building Use", placeholder: "e.g. Residential / Commercial" },
      ],
      buildQuery: (vals) => {
        const parts = ["What are the setback (open space) requirements"];
        if (vals.roadWidth) parts.push(`for a ${vals.roadWidth} m road width`);
        if (vals.plotSize) parts.push(`with plot size/depth ${vals.plotSize}`);
        if (vals.buildingUse) parts.push(`for ${vals.buildingUse} use`);
        return `${parts.join(" ")}?`;
      },
    },
    {
      id: "floors",
      label: "Permissible Floors & Height",
      description: "Determine maximum floors, height restrictions, and FAR limits",
      fields: [
        { id: "roadWidth", label: "Road Width", placeholder: "e.g. 18", unit: "meters" },
        { id: "areaType", label: "Area / Zone", placeholder: "e.g. Core area / Outer area" },
      ],
      buildQuery: (vals) => {
        const parts = ["What is the maximum permissible number of floors and height"];
        if (vals.roadWidth) parts.push(`on a ${vals.roadWidth} m road`);
        if (vals.areaType) parts.push(`in ${vals.areaType}`);
        return `${parts.join(" ")}?`;
      },
    },
    {
      id: "fees",
      label: "Fees & Application Rules",
      description: "Lookup fee schedule, scrutiny charges, and mandatory submission documents",
      fields: [
        { id: "proposalType", label: "Type of Proposal", placeholder: "e.g. New residential building / Layout approval" },
      ],
      buildQuery: (vals) => {
        return vals.proposalType
          ? `What fees and application scrutiny rules apply for ${vals.proposalType}?`
          : "What fees and application requirements apply to building permission?";
      },
    },
    {
      id: "rule_lookup",
      label: "Direct Rule Lookup",
      description: "Inspect specific rule numbers (e.g. Rule 29, Rule 42, Rule 54)",
      fields: [
        { id: "ruleNum", label: "Rule Number", placeholder: "e.g. 29" },
      ],
      buildQuery: (vals) => {
        return vals.ruleNum
          ? `Show Rule ${vals.ruleNum} text and requirements`
          : "Show Rule 29 source passage and provisions";
      },
    },
  ],
  hi: [
    {
      id: "setback",
      label: "सेटबैक और खुला स्थान",
      description: "सड़क की चौड़ाई और भूखंड के अनुसार आगे, पीछे और किनारों का खुला स्थान जांचें",
      fields: [
        { id: "roadWidth", label: "सड़क की चौड़ाई", placeholder: "उदा. 12", unit: "मीटर" },
        { id: "plotSize", label: "भूखंड क्षेत्रफल/गहराई", placeholder: "उदा. 150", unit: "वर्ग मी / मी" },
        { id: "buildingUse", label: "भवन उपयोग", placeholder: "उदा. आवासीय / व्यावसायिक" },
      ],
      buildQuery: (vals) => {
        const parts = ["भवन के लिए सेटबैक (खुला स्थान) की आवश्यकताएं क्या हैं"];
        if (vals.roadWidth) parts.push(`${vals.roadWidth} मीटर सड़क पर`);
        if (vals.plotSize) parts.push(`भूखंड ${vals.plotSize}`);
        if (vals.buildingUse) parts.push(`${vals.buildingUse} उपयोग हेतु`);
        return `${parts.join(", ")}?`;
      },
    },
    {
      id: "floors",
      label: "अनुमत मंजिल और ऊंचाई",
      description: "सड़क चौड़ाई के आधार पर अधिकतम अनुमेय मंजिलें, ऊंचाई और एफ.ए.आर.",
      fields: [
        { id: "roadWidth", label: "सड़क की चौड़ाई", placeholder: "उदा. 18", unit: "मीटर" },
        { id: "areaType", label: "क्षेत्र", placeholder: "उदा. कोर क्षेत्र / बाह्य क्षेत्र" },
      ],
      buildQuery: (vals) => {
        const parts = ["अधिकतम कितनी मंजिलें और ऊंचाई अनुमत है"];
        if (vals.roadWidth) parts.push(`${vals.roadWidth} मीटर सड़क पर`);
        if (vals.areaType) parts.push(`${vals.areaType} में`);
        return `${parts.join(", ")}?`;
      },
    },
    {
      id: "fees",
      label: "शुल्क और आवेदन नियम",
      description: "भवन अनुमति शुल्क तालिका, संवीक्षा शुल्क और अनिवार्य संलग्नक",
      fields: [
        { id: "proposalType", label: "प्रस्ताव का प्रकार", placeholder: "उदा. नवीन आवासीय भवन / अभिन्यास" },
      ],
      buildQuery: (vals) => {
        return vals.proposalType
          ? `${vals.proposalType} के लिए कौन-से शुल्क और आवेदन नियम लागू होते हैं?`
          : "भवन अनुमति के लिए कौन-से शुल्क और आवेदन की आवश्यकता है?";
      },
    },
    {
      id: "rule_lookup",
      label: "सीधा नियम अवलोकन",
      description: "नियम संख्या के अनुसार सीधा पाठ देखें (उदा. नियम 29, नियम 42)",
      fields: [
        { id: "ruleNum", label: "नियम संख्या", placeholder: "उदा. 29" },
      ],
      buildQuery: (vals) => {
        return vals.ruleNum
          ? `नियम ${vals.ruleNum} का विवरण और नियम दिखाएं`
          : "नियम 29 का स्रोत अंश और प्रावधान दिखाएं";
      },
    },
  ],
};

const suggestedExamples: Record<Language, string[]> = {
  en: [
    "What is the setback for a 12 m road?",
    "What is the rule for a 9 m plot depth?",
    "Show Rule 29 source passage",
    "What are the requirements for parking and basement?",
  ],
  hi: [
    "12 मीटर सड़क के लिए सेटबैक कितना है?",
    "9 मीटर प्लॉट के लिए नियम क्या है?",
    "नियम 29 का स्रोत अंश दिखाएं",
    "पार्किंग और बेसमेंट के लिए क्या नियम हैं?",
  ],
};

// Safe HTML escaper for export reports
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
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

// Highlight matching words in the excerpt without altering source integrity
function renderHighlightedExcerpt(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;

  // Extract significant search keywords (length >= 3)
  const words = query
    .toLowerCase()
    .split(/[\s,?.!-]+/)
    .filter((w) => w.length >= 3 && !["what", "which", "when", "with", "from", "that", "this", "rule"].includes(w));

  if (words.length === 0) return <span>{text}</span>;

  // Build regex safely escaping keywords
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#FEF08A]/70 text-[#171717] px-0.5 rounded-xs font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Template form state
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [templateFormValues, setTemplateFormValues] = useState<Record<string, string>>({});

  // Expanded citations state
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const t = copy[language];

  // Load history from session storage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(stored)) {
        setHistory(stored);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [query]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  async function executeQuery(searchQuery: string, chosenTemplateId?: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          language,
          templateId: chosenTemplateId,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = (await response.json()) as Result;
      setResult(data);

      // Expand first citation by default for convenience
      if (data.citations && data.citations.length > 0) {
        setExpandedCitations({ [data.citations[0].id]: true });
      }

      const updatedHistory = [data, ...history.filter((item) => item.id !== data.id)].slice(0, 15);
      setHistory(updatedHistory);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      showToast(language === "hi" ? "त्रुटि: उत्तर प्राप्त नहीं हो सका" : "Unable to retrieve rule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    executeQuery(query);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTemplateFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeTemplate) return;
    const generatedQuery = activeTemplate.buildQuery(templateFormValues);
    setQuery(generatedQuery);
    setActiveTemplate(null);
    setTemplateFormValues({});
    executeQuery(generatedQuery, activeTemplate.id);
  }

  function selectHistoryItem(item: Result) {
    setResult(item);
    setQuery(item.question);
    if (item.citations && item.citations.length > 0) {
      setExpandedCitations({ [item.citations[0].id]: true });
    }
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    sessionStorage.removeItem(HISTORY_KEY);
    showToast(language === "hi" ? "इतिहास हटाया गया" : "History cleared");
  }

  async function copyAnswer() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      showToast(language === "hi" ? "उत्तर कॉपी किया गया" : "Answer copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(language === "hi" ? "कॉपी विफल" : "Failed to copy");
    }
  }

  function downloadText() {
    if (!result) return;
    const text = [
      `==============================================================`,
      `${t.productName} · ${t.productSubtitle}`,
      `Query: ${result.question}`,
      `Timestamp: ${new Date(result.createdAt).toLocaleString()}`,
      `Status: ${result.status === "supported" ? t.supportedBadge : t.notFoundBadge}`,
      `==============================================================`,
      "",
      `[REGULATION SUMMARY]`,
      result.answer,
      "",
      `[VERIFIED SOURCES]`,
      ...result.citations.map(
        (c, idx) =>
          `[${idx + 1}] ${c.rule} · ${c.title}\nSource: ${c.sourceTitle} (Page ${c.page})\n${c.excerpt}\n`
      ),
      "",
      result.limitations.length > 0 ? `[LIMITATIONS]\n${result.limitations.join("\n")}\n` : "",
      `[STATUTORY NOTICE]`,
      SOURCE_NOTE,
      t.disclaimer,
    ].join("\n");

    saveBlob(text, "text/plain;charset=utf-8", `niyamsetu-answer-${Date.now()}.txt`);
    showToast(language === "hi" ? "टेक्स्ट फ़ाइल डाउनलोड हुई" : "Exported text file");
  }

  function buildReportHtml() {
    if (!result) return "";
    const sourcesHtml = result.citations
      .map(
        (c) => `
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #E5E5E5; border-radius: 6px; background: #FAFAFA;">
        <div style="font-weight: 600; font-size: 14px; color: #171717; margin-bottom: 4px;">
          ${escapeHtml(c.rule)}: ${escapeHtml(c.title)}
        </div>
        <div style="font-size: 12px; color: #6B6B6B; margin-bottom: 12px;">
          ${escapeHtml(c.sourceTitle)} &bull; PDF Page ${c.page}
        </div>
        <blockquote style="margin: 0; padding-left: 14px; border-left: 3px solid #171717; font-size: 13px; line-height: 1.6; color: #262626; white-space: pre-line;">
          ${escapeHtml(c.excerpt)}
        </blockquote>
      </div>`
      )
      .join("");

    const limitationsHtml =
      result.limitations.length > 0
        ? `<div style="margin-top: 24px;">
             <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B6B6B; margin-bottom: 8px;">${escapeHtml(t.limitations)}</h3>
             <ul style="font-size: 13px; color: #525252; padding-left: 20px; line-height: 1.6;">
               ${result.limitations.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
             </ul>
           </div>`
        : "";

    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(t.productName)} - Evidence Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Nirmala UI", sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      color: #171717;
      background: #FFFFFF;
      line-height: 1.6;
    }
    .header {
      border-bottom: 1px solid #E5E5E5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      background: ${result.status === "supported" ? "#DCFCE7" : "#FEF3C7"};
      color: ${result.status === "supported" ? "#166534" : "#92400E"};
      margin-top: 8px;
    }
    .question {
      font-size: 18px;
      font-weight: 600;
      margin: 16px 0 8px;
      color: #171717;
    }
    .answer-box {
      background: #F9F9F9;
      border: 1px solid #E5E5E5;
      border-radius: 6px;
      padding: 18px;
      font-size: 14px;
      line-height: 1.65;
      white-space: pre-line;
      margin-bottom: 32px;
    }
    .footer {
      border-top: 1px solid #E5E5E5;
      margin-top: 40px;
      padding-top: 16px;
      font-size: 11px;
      color: #737373;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 20px; font-weight: 600;">${escapeHtml(t.productName)} · ${escapeHtml(t.productSubtitle)}</div>
    <div style="font-size: 12px; color: #6B6B6B; margin-top: 2px;">
      ${escapeHtml(new Date(result.createdAt).toLocaleString())} &bull; ${escapeHtml(SOURCE_NOTE)}
    </div>
    <div class="badge">${result.status === "supported" ? escapeHtml(t.supportedBadge) : escapeHtml(t.notFoundBadge)}</div>
  </div>

  <div class="question">${escapeHtml(result.question)}</div>

  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B6B6B; margin-bottom: 6px;">
    ${escapeHtml(t.answerSummary)}
  </h3>
  <div class="answer-box">${escapeHtml(result.answer)}</div>

  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B6B6B; margin-bottom: 12px;">
    ${escapeHtml(t.evidenceHeader)}
  </h3>
  ${sourcesHtml}

  ${limitationsHtml}

  <div class="footer">
    <p><strong>Official Reference Aid:</strong> ${escapeHtml(t.disclaimer)}</p>
    <p>${escapeHtml(t.statutoryNotice)}</p>
  </div>
</body>
</html>`;
  }

  function downloadReport() {
    if (!result) return;
    saveBlob(buildReportHtml(), "text/html;charset=utf-8", `niyamsetu-evidence-report-${Date.now()}.html`);
    showToast(language === "hi" ? "साक्ष्य रिपोर्ट डाउनलोड हुई" : "Evidence report saved");
  }

  function printReport() {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(buildReportHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function toggleCitationExpand(id: string) {
    setExpandedCitations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function startNewConversation() {
    setResult(null);
    setQuery("");
    setActiveTemplate(null);
  }

  return (
    <div className={`min-h-screen bg-white text-[#171717] flex flex-col ${language === "hi" ? "font-hindi" : ""}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-md bg-[#171717] px-4 py-2.5 text-xs text-white shadow-sm transition-all duration-150 animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Header - Compact, minimal, purposeful */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E5E5E5] bg-white/95 px-4 backdrop-blur-xs sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={t.openSidebar}
            title={t.openSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E5E5] text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#171717] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={startNewConversation}
            className="group flex items-center gap-2 text-left"
          >
            <span className="text-sm font-semibold tracking-tight text-[#171717]">
              {t.productName}
            </span>
            <span className="hidden text-xs text-[#6B6B6B] sm:inline">
              · {t.productSubtitle}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Version badge */}
          <span className="hidden text-[11px] text-[#6B6B6B] md:inline border border-[#E5E5E5] rounded px-2 py-0.5 bg-[#F9F9F9]">
            {t.badgeOfficial}
          </span>

          {/* New Query Shortcut */}
          {result && (
            <button
              type="button"
              onClick={startNewConversation}
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1 text-xs font-medium text-[#171717] hover:bg-[#F0F0F0] transition-colors"
            >
              <svg className="h-3.5 w-3.5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>{t.newQuery}</span>
            </button>
          )}

          {/* Bilingual Switcher */}
          <div className="flex items-center rounded-md border border-[#E5E5E5] bg-[#F9F9F9] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                language === "en"
                  ? "bg-white text-[#171717] shadow-2xs"
                  : "text-[#6B6B6B] hover:text-[#171717]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              aria-pressed={language === "hi"}
              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                language === "hi"
                  ? "bg-white text-[#171717] shadow-2xs"
                  : "text-[#6B6B6B] hover:text-[#171717]"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with Slide-in / Collapsible Sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar Overlay for small screens */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#E5E5E5] bg-[#F9F9F9] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-b border-[#E5E5E5] px-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              {t.recentQueries}
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  title={t.clearHistory}
                  className="rounded p-1 text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#171717] text-xs"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label={t.closeSidebar}
                className="rounded p-1 text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#171717]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Query Button in Sidebar */}
          <div className="p-3 border-b border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => {
                startNewConversation();
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-medium text-[#171717] shadow-2xs hover:bg-[#F0F0F0] transition-colors"
            >
              <svg className="h-4 w-4 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t.newQuery}
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-2">
            {history.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6B6B6B]">
                {t.noRecent}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((item) => {
                  const isCurrent = result?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectHistoryItem(item)}
                      className={`group flex flex-col rounded-md px-3 py-2 text-left transition-colors ${
                        isCurrent
                          ? "bg-white font-medium text-[#171717] shadow-2xs border border-[#E5E5E5]"
                          : "text-[#525252] hover:bg-[#F0F0F0] hover:text-[#171717]"
                      }`}
                    >
                      <span className="truncate text-xs">{item.question}</span>
                      <span className="mt-1 text-[10px] text-[#A3A3A3]">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-[#E5E5E5] p-3 text-[11px] text-[#737373] leading-relaxed">
            {SOURCE_NOTE}
          </div>
        </aside>

        {/* Primary Content View - Comfortable reading column (max-w-[780px]) */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[800px] flex-col px-4 py-8 sm:px-6 lg:px-8">
            
            {/* Regulatory Notice Banner - Quiet, non-intrusive */}
            <div className="mb-8 rounded-md border border-[#E5E5E5] bg-[#F9F9F9] px-3.5 py-2.5 text-xs text-[#6B6B6B] flex items-start gap-2.5">
              <svg className="h-4 w-4 shrink-0 text-[#737373] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="leading-relaxed">{t.statutoryNotice}</span>
            </div>

            {/* Conversation Flow or Initial State */}
            {!result ? (
              /* Initial Welcome State - Calm, minimal, ChatGPT-like */
              <div className="my-auto flex flex-col py-6">
                <div className="mb-8 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#171717]">
                    {t.welcomePrompt}
                  </h1>
                  <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed max-w-xl">
                    {t.welcomeSubtext}
                  </p>
                </div>

                {/* Composer in Initial State */}
                <div className="mb-8">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="relative rounded-2xl border border-[#E5E5E5] bg-white p-3 shadow-xs hover:border-[#D4D4D4] focus-within:border-[#171717] focus-within:ring-1 focus-within:ring-[#171717] transition-all">
                      <textarea
                        ref={textareaRef}
                        id="query-box"
                        rows={3}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t.placeholder}
                        className="w-full resize-none border-0 bg-transparent p-1 text-sm text-[#171717] placeholder-[#A3A3A3] focus:outline-none focus:ring-0 leading-relaxed"
                      />
                      <div className="flex items-center justify-between pt-2">
                        <span className="hidden sm:inline text-[11px] text-[#A3A3A3]">
                          {t.shiftEnterHint}
                        </span>
                        <button
                          type="submit"
                          disabled={loading || !query.trim()}
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={t.ask}
                        >
                          {loading ? (
                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Template Config Form (When selected) */}
                {activeTemplate && (
                  <div className="mb-8 rounded-xl border border-[#E5E5E5] bg-[#F9F9F9] p-5 shadow-xs transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-sm font-semibold text-[#171717]">
                          {activeTemplate.label}
                        </h2>
                        <p className="text-xs text-[#6B6B6B] mt-0.5">
                          {activeTemplate.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTemplate(null);
                          setTemplateFormValues({});
                        }}
                        className="text-xs text-[#6B6B6B] hover:text-[#171717]"
                      >
                        {t.cancelForm}
                      </button>
                    </div>

                    <form onSubmit={handleTemplateFormSubmit} className="mt-4 flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeTemplate.fields.map((field) => (
                          <div key={field.id} className="flex flex-col gap-1">
                            <label htmlFor={field.id} className="text-xs font-medium text-[#525252]">
                              {field.label} {field.unit && <span className="text-[#A3A3A3]">({field.unit})</span>}
                            </label>
                            <input
                              id={field.id}
                              type="text"
                              value={templateFormValues[field.id] || ""}
                              onChange={(e) =>
                                setTemplateFormValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                              placeholder={field.placeholder}
                              className="rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTemplate(null)}
                          className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-xs text-[#525252] hover:bg-[#F0F0F0]"
                        >
                          {t.cancelForm}
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-[#171717] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          {t.generateFromForm}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Common Query Templates */}
                <div className="mb-6">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[#737373]">
                    {t.commonTemplates}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {queryTemplates[language].map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setActiveTemplate(tpl);
                          setTemplateFormValues({});
                        }}
                        className={`group flex items-start justify-between rounded-lg border p-3 text-left transition-all ${
                          activeTemplate?.id === tpl.id
                            ? "border-[#171717] bg-white"
                            : "border-[#E5E5E5] bg-white hover:border-[#D4D4D4] hover:bg-[#F9F9F9]"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-[#171717]">{tpl.label}</div>
                          <div className="mt-1 text-[11px] text-[#6B6B6B] leading-snug">
                            {tpl.description}
                          </div>
                        </div>
                        <svg
                          className="h-4 w-4 shrink-0 text-[#A3A3A3] group-hover:text-[#171717] group-hover:translate-x-0.5 transition-all mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggested Questions */}
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[#737373]">
                    {t.suggestedQueries}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedExamples[language].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          executeQuery(item);
                        }}
                        className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs text-[#525252] hover:border-[#D4D4D4] hover:bg-[#F9F9F9] hover:text-[#171717] transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Active Conversation State */
              <div className="flex flex-col pb-32">
                {/* User's Question Block */}
                <div className="mb-8 flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-xs font-semibold text-[#525252]">
                    Q
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h2 className="text-base sm:text-lg font-medium text-[#171717] leading-relaxed">
                      {result.question}
                    </h2>
                  </div>
                </div>

                {/* Assistant Answer Section */}
                <div className="mb-10 flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-xs font-semibold text-[#171717]">
                    §
                  </div>
                  <div className="flex-1 space-y-6">
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          result.status === "supported"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            result.status === "supported" ? "bg-[#16a34a]" : "bg-[#d97706]"
                          }`}
                        />
                        {result.status === "supported" ? t.supportedBadge : t.notFoundBadge}
                      </span>
                      <span className="text-xs text-[#A3A3A3]">
                        {new Date(result.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Answer content */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-2">
                        {t.answerSummary}
                      </div>
                      <div className="text-[15px] sm:text-base leading-relaxed text-[#171717] whitespace-pre-line font-normal">
                        {result.answer}
                      </div>
                    </div>

                    {/* Secondary Actions Bar - Copy, Report, Print */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={copyAnswer}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] hover:bg-[#F9F9F9] hover:text-[#171717] transition-colors"
                        title={t.copyAnswer}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copied ? t.copiedAnswer : t.copyAnswer}
                      </button>

                      <button
                        type="button"
                        onClick={downloadReport}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] hover:bg-[#F9F9F9] hover:text-[#171717] transition-colors"
                        title={t.downloadReport}
                      >
                        <svg className="h-3.5 w-3.5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t.downloadReport}
                      </button>

                      <button
                        type="button"
                        onClick={printReport}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] hover:bg-[#F9F9F9] hover:text-[#171717] transition-colors"
                        title={t.printReport}
                      >
                        <svg className="h-3.5 w-3.5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        {t.printReport}
                      </button>

                      <button
                        type="button"
                        onClick={downloadText}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#525252] hover:bg-[#F9F9F9] hover:text-[#171717] transition-colors"
                        title={t.downloadTxt}
                      >
                        <svg className="h-3.5 w-3.5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.downloadTxt}
                      </button>
                    </div>

                    {/* Sources and Evidence Section */}
                    {result.citations.length > 0 && (
                      <div className="pt-4">
                        <div className="mb-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                            {t.evidenceHeader}
                          </div>
                          <div className="text-xs text-[#6B6B6B]">
                            {t.evidenceSubtext}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {result.citations.map((c, index) => {
                            const isExpanded = !!expandedCitations[c.id];
                            const pdfHref = `/MP_Bhumi_Vikas_Rules_2012_upto_2025-03-06_${c.sourceLanguage === "hi" ? "HI" : "EN"}.pdf#page=${c.page}`;

                            return (
                              <div
                                key={c.id || index}
                                className="rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] transition-all hover:border-[#D4D4D4]"
                              >
                                {/* Citation summary bar */}
                                <div className="flex items-start justify-between p-3.5">
                                  <div className="flex-1 pr-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold text-[#171717]">
                                        {c.rule}
                                      </span>
                                      <span className="text-xs text-[#525252]">
                                        {c.title}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B6B6B]">
                                      <span>
                                        {t.sourceDocLabel} {c.sourceTitle}
                                      </span>
                                      <span>&bull;</span>
                                      <span className="font-medium text-[#171717]">
                                        {t.pageLabel} {c.page}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Direct PDF link button */}
                                    <a
                                      href={pdfHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded border border-[#E5E5E5] bg-white px-2 py-1 text-[11px] font-medium text-[#171717] hover:bg-[#F0F0F0] transition-colors"
                                      title={t.openOriginalPdf}
                                    >
                                      <span>PDF p.{c.page}</span>
                                      <svg className="h-3 w-3 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>

                                    {/* Toggle expand button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleCitationExpand(c.id)}
                                      className="rounded p-1 text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#171717]"
                                      aria-label={isExpanded ? t.collapseSource : t.expandSource}
                                    >
                                      <svg
                                        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7 7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Passage display */}
                                {isExpanded && (
                                  <div className="border-t border-[#E5E5E5] bg-white p-3.5 rounded-b-lg">
                                    <div className="text-[11px] font-medium text-[#737373] mb-1.5">
                                      {t.highlightLabel}
                                    </div>
                                    <blockquote className="border-l-2 border-[#171717] pl-3 py-0.5 text-xs sm:text-[13px] leading-relaxed text-[#262626] whitespace-pre-line font-normal">
                                      {renderHighlightedExcerpt(c.excerpt, result.question)}
                                    </blockquote>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Limitations Section */}
                    {result.limitations.length > 0 && (
                      <div className="rounded-lg border border-[#E5E5E5] bg-[#F9F9F9] p-4 text-xs">
                        <div className="font-semibold uppercase tracking-wider text-[#737373] mb-1.5">
                          {t.limitations}
                        </div>
                        <ul className="list-inside list-disc space-y-1 text-[#525252] leading-relaxed">
                          {result.limitations.map((limit, idx) => (
                            <li key={idx}>{limit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <div className="text-[11px] text-[#A3A3A3] leading-relaxed pt-2">
                      {t.disclaimer}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Composer when an active conversation is underway */}
          {result && (
            <div className="sticky bottom-0 z-20 w-full border-t border-[#E5E5E5] bg-white/95 px-4 py-3 backdrop-blur-xs sm:px-6">
              <div className="mx-auto max-w-[800px]">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="relative rounded-xl border border-[#E5E5E5] bg-white p-2.5 shadow-xs focus-within:border-[#171717] focus-within:ring-1 focus-within:ring-[#171717] transition-all">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={language === "hi" ? "आगे कोई प्रश्न पूछें…" : "Ask a follow-up question…"}
                      className="w-full resize-none border-0 bg-transparent p-1 text-sm text-[#171717] placeholder-[#A3A3A3] focus:outline-none focus:ring-0 leading-relaxed"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="hidden sm:inline text-[10px] text-[#A3A3A3]">
                        {t.shiftEnterHint}
                      </span>
                      <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#171717] text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={t.ask}
                      >
                        {loading ? (
                          <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
