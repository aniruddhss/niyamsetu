import type { SitePlanData } from "./setbacks";

// Pure function: SitePlanData -> SVG markup. Schematic only; the plot is drawn as a square.

const W = 400;
const PAD = 50;
const INK = "#1d2433";
const GREY = "#5b6475";
const PLOT_FILL = "#eef3f1";
const BAND_FILL = "#cfe7dd";
const ZONE_FILL = "#0b5d4b";
const FONT = `font-family="'Nirmala UI', Arial, sans-serif"`;
const TITLE_Y = 28;
const ROAD_GAP = 14;
const ROAD_H = 44;
const MARK_OFFSET = 10;

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]!);
}

function fmt(value: number) {
  return escapeXml(String(Number(value.toFixed(2))));
}

function text(x: number, y: number, label: string, attrs: string) {
  return `<text x="${x}" y="${y}" ${FONT} ${attrs}>${escapeXml(label)}</text>`;
}

function rect(x: number, y: number, w: number, h: number, attrs: string, tooltip: string) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs}><title>${escapeXml(tooltip)}</title></rect>`;
}

function mark(x: number, y: number, h: number, value: number) {
  return [
    `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${GREY}" stroke-width="2"/>`,
    `<line x1="${x - 4}" y1="${y}" x2="${x + 4}" y2="${y}" stroke="${GREY}" stroke-width="2"/>`,
    `<line x1="${x - 4}" y1="${y + h}" x2="${x + 4}" y2="${y + h}" stroke="${GREY}" stroke-width="2"/>`,
    text(x + 6, y + h / 2 + 4, `${fmt(value)} m`, `font-size="11" fill="${GREY}"`),
  ].join("");
}

export function renderSitePlanSvg(data: SitePlanData): string | null {
  const { plotAreaSqm, roadWidthM, frontM, rearM } = data;
  if (frontM === null && rearM === null) return null;

  const side = plotAreaSqm && plotAreaSqm > 0 ? Math.sqrt(plotAreaSqm) : 12;
  const scale = (W - 2 * PAD) / side;
  const plotPx = side * scale;
  const plotX = PAD;
  const plotY = PAD;
  const plotBottom = plotY + plotPx;
  const roadY = plotBottom + ROAD_GAP;
  const footerY = roadY + ROAD_H + 26;
  const H = footerY + 18;
  const cx = plotX + plotPx / 2;
  const markX = plotX + plotPx + MARK_OFFSET;

  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`);
  parts.push(text(W / 2, TITLE_Y, "Site plan (schematic, not to scale)", `font-size="13" font-weight="700" fill="${INK}" text-anchor="middle"`));

  const plotTip = plotAreaSqm ? `Plot ${fmt(plotAreaSqm)} sq m (drawn as a square)` : "Plot size not given (illustrative)";
  parts.push(rect(plotX, plotY, plotPx, plotPx, `fill="${PLOT_FILL}" stroke="${INK}" stroke-width="2"`, plotTip));

  const rearPx = rearM && rearM > 0 ? rearM * scale : 0;
  const frontPx = frontM && frontM > 0 ? frontM * scale : 0;

  if (rearPx > 0) {
    parts.push(rect(plotX, plotY, plotPx, rearPx, `fill="${BAND_FILL}"`, `Rear open space ${fmt(rearM!)} m (Rule 56(2)(a))`));
    parts.push(text(cx, plotY + rearPx / 2 + 4, `Rear open space ${fmt(rearM!)} m`, `font-size="12" fill="${INK}" text-anchor="middle"`));
    parts.push(mark(markX, plotY, rearPx, rearM!));
  }
  if (frontPx > 0) {
    const y = plotBottom - frontPx;
    parts.push(rect(plotX, y, plotPx, frontPx, `fill="${BAND_FILL}"`, `Front open space ${fmt(frontM!)} m (Rule 56(1)(a))`));
    parts.push(text(cx, y + frontPx / 2 + 4, `Front open space ${fmt(frontM!)} m`, `font-size="12" fill="${INK}" text-anchor="middle"`));
    parts.push(mark(markX, y, frontPx, frontM!));
  }

  const zoneY = plotY + rearPx + 4;
  const zoneH = plotPx - rearPx - frontPx - 8;
  if (zoneH >= 20) {
    parts.push(rect(plotX + 10, zoneY, plotPx - 20, zoneH, `rx="4" fill="${ZONE_FILL}"`, "Building zone (after Rule 56 front/rear open spaces; side open spaces not drawn)"));
    parts.push(text(cx, zoneY + zoneH / 2 + 5, "Building zone", `font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle"`));
  }
  // Redraw the outline on top so band fills don't cover the stroke.
  parts.push(`<rect x="${plotX}" y="${plotY}" width="${plotPx}" height="${plotPx}" fill="none" stroke="${INK}" stroke-width="2"/>`);

  const roadLabel = roadWidthM ? `ROAD · ${fmt(roadWidthM)} m wide` : "ROAD";
  parts.push(rect(0, roadY, W, ROAD_H, `fill="${GREY}"`, roadWidthM ? `Road ${fmt(roadWidthM)} m wide (sets front open space, Rule 56(1)(a))` : "Road (width not given)"));
  parts.push(`<line x1="0" y1="${roadY + ROAD_H / 2}" x2="${W}" y2="${roadY + ROAD_H / 2}" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8"/>`);
  const labelW = roadLabel.length * 8 + 20;
  parts.push(`<rect x="${W / 2 - labelW / 2}" y="${roadY + ROAD_H / 2 - 10}" width="${labelW}" height="20" fill="${GREY}"/>`);
  parts.push(text(W / 2, roadY + ROAD_H / 2 + 4, roadLabel, `font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle"`));

  parts.push(text(W / 2, footerY, plotTip, `font-size="11" fill="${GREY}" text-anchor="middle"`));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Site plan (schematic, not to scale)">${parts.join("")}</svg>`;
}
