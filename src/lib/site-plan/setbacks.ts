// Rule 56, M.P. Bhumi Vikas Rules 2012: open spaces for residential buildings up to 12.5 m high.
// Numbers come only from these tables; never from the LLM.

export const MAX_HEIGHT_M = 12.5;
export const TALL_BUILDING_NOTE = "Rule 56(5): use Tables 4 and 5 of Rule 42";
export const FRONT_RULE = "Rule 56(1)(a)";
export const REAR_RULE = "Rule 56(2)(a)";

// [upper bound inclusive, open space in metres]
const FRONT_BY_STREET_WIDTH: [number, number][] = [
  [9, 3.0],
  [12, 3.6],
  [18, 4.5],
  [Infinity, 6.0],
];

const REAR_BY_PLOT_AREA: [number, number][] = [
  [40, 0],
  [150, 1.5],
  [225, 2.5],
  [Infinity, 3.0],
];

function lookup(table: [number, number][], value: number) {
  return table.find(([upTo]) => value <= upTo)![1];
}

export function frontOpenSpace(streetWidthM: number) {
  return lookup(FRONT_BY_STREET_WIDTH, streetWidthM);
}

export function rearOpenSpace(plotAreaSqm: number) {
  return lookup(REAR_BY_PLOT_AREA, plotAreaSqm);
}

export type SitePlanInputs = {
  plotAreaSqm: number | null;
  roadWidthM: number | null;
  heightM: number | null;
  wantsFront: boolean;
  wantsRear: boolean;
};

export type SitePlanData = {
  plotAreaSqm: number | null;
  roadWidthM: number | null;
  frontM: number | null;
  rearM: number | null;
};

export type SitePlanResult = SitePlanData & { heightM: number | null; note: string | null };

const NUM = String.raw`(\d+(?:\.\d+)?)`;
const METRE = String.raw`(?:metres?|meters?|mtrs?|m|मीटर)`;

function firstNumber(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

export function extractSitePlanInputs(question: string): SitePlanInputs {
  const text = question.toLowerCase();
  const plotAreaSqm = firstNumber(text, [
    new RegExp(`${NUM}\\s*(?:sq\\.?\\s*m(?:t|tr|eters?|etres?)?|sqm|m2|m²|square\\s*met(?:er|re)s?|वर्ग\\s*मीटर|वर्गमीटर)`),
  ]);
  const roadWidthM = firstNumber(text, [
    new RegExp(`${NUM}\\s*${METRE}\\s*(?:wide\\s*|चौड़ी\\s*)?(?:road|street|सड़क|रोड|मार्ग)`),
    new RegExp(`(?:road|street|सड़क|रोड|मार्ग)\\s*(?:width|चौड़ाई)?\\s*(?:of|is|=|:|की)?\\s*${NUM}\\s*${METRE}`),
  ]);
  const heightM = firstNumber(text, [
    new RegExp(`${NUM}\\s*${METRE}\\s*(?:high|tall|height|ऊंचा|ऊँचा|ऊंचाई|ऊँचाई)`),
    new RegExp(`(?:height|ऊंचाई|ऊँचाई)\\s*(?:of|is|=|:|की)?\\s*${NUM}\\s*${METRE}`),
  ]);
  const front = /\bfront\b|सामने|अग्र/.test(text);
  const rear = /\brear\b|\bback\b|पीछे|पिछल|पृष्ठ/.test(text);
  const general = /setback|open\s*space|margin|m\.?o\.?s\.?|सेटबैक|खुला\s*स्थान|खाली\s*जगह|site\s*plan/.test(text);
  // Asking about neither side specifically but about setbacks in general means both.
  const both = !front && !rear && general;
  return { plotAreaSqm, roadWidthM, heightM, wantsFront: front || both, wantsRear: rear || both };
}

export function computeSitePlan(inputs: SitePlanInputs): SitePlanResult | null {
  const { plotAreaSqm, roadWidthM, heightM, wantsFront, wantsRear } = inputs;
  if (!wantsFront && !wantsRear) return null;
  if (heightM !== null && heightM > MAX_HEIGHT_M) {
    return { plotAreaSqm, roadWidthM, heightM, frontM: null, rearM: null, note: TALL_BUILDING_NOTE };
  }
  const frontM = wantsFront && roadWidthM !== null && roadWidthM > 0 ? frontOpenSpace(roadWidthM) : null;
  const rearM = wantsRear && plotAreaSqm !== null && plotAreaSqm > 0 ? rearOpenSpace(plotAreaSqm) : null;
  if (frontM === null && rearM === null) return null;
  return { plotAreaSqm, roadWidthM, heightM, frontM, rearM, note: null };
}
