import { test } from "node:test";
import assert from "node:assert/strict";
import {
  frontOpenSpace,
  rearOpenSpace,
  extractSitePlanInputs,
  computeSitePlan,
  TALL_BUILDING_NOTE,
} from "../src/lib/site-plan/setbacks.ts";
import { renderSitePlanSvg } from "../src/lib/site-plan/svg.ts";

test("front open space boundaries (Rule 56(1)(a))", () => {
  const cases = [
    [6, 3.0], [9, 3.0], [9.01, 3.6], [12, 3.6], [12.01, 4.5], [18, 4.5], [18.01, 6.0], [30, 6.0],
  ];
  for (const [width, expected] of cases) assert.equal(frontOpenSpace(width), expected, `street ${width} m`);
});

test("rear open space boundaries (Rule 56(2)(a))", () => {
  const cases = [
    [30, 0], [40, 0], [40.01, 1.5], [150, 1.5], [150.01, 2.5], [225, 2.5], [225.01, 3.0], [500, 3.0],
  ];
  for (const [area, expected] of cases) assert.equal(rearOpenSpace(area), expected, `plot ${area} sq m`);
});

test("200 sq m plot on a 9 m road, front and rear", () => {
  const inputs = extractSitePlanInputs("200 sq m plot on a 9 m road, front and rear?");
  assert.equal(inputs.plotAreaSqm, 200);
  assert.equal(inputs.roadWidthM, 9);
  const plan = computeSitePlan(inputs);
  assert.deepEqual(
    { frontM: plan.frontM, rearM: plan.rearM, note: plan.note },
    { frontM: 3.0, rearM: 2.5, note: null },
  );
  const svg = renderSitePlanSvg(plan);
  assert.match(svg, /Front open space 3 m/);
  assert.match(svg, /Rear open space 2.5 m/);
  assert.match(svg, /Building zone/);
  assert.match(svg, /ROAD · 9 m wide/);
  assert.match(svg, /Plot 200 sq m \(drawn as a square\)/);
});

test("front-only question draws only the front band", () => {
  const plan = computeSitePlan(extractSitePlanInputs("What is the front setback for a 150 sq m plot on a 12 m road?"));
  assert.equal(plan.frontM, 3.6);
  assert.equal(plan.rearM, null);
  const svg = renderSitePlanSvg(plan);
  assert.match(svg, /Front open space 3.6 m/);
  assert.doesNotMatch(svg, /Rear open space/);
});

test("general setback question computes both sides", () => {
  const plan = computeSitePlan(extractSitePlanInputs("Setback for a 100 sqm plot facing a 15 m wide road"));
  assert.equal(plan.frontM, 4.5);
  assert.equal(plan.rearM, 1.5);
});

test("Hindi question is parsed", () => {
  const plan = computeSitePlan(extractSitePlanInputs("200 वर्ग मीटर प्लॉट, 12 मीटर सड़क के लिए सेटबैक कितना है?"));
  assert.equal(plan.frontM, 3.6);
  assert.equal(plan.rearM, 2.5);
});

test("building above 12.5 m is not calculated", () => {
  const plan = computeSitePlan(extractSitePlanInputs("Front and rear setback for a 15 m high building, 200 sq m plot, 12 m road"));
  assert.equal(plan.frontM, null);
  assert.equal(plan.rearM, null);
  assert.equal(plan.note, TALL_BUILDING_NOTE);
  assert.equal(renderSitePlanSvg(plan), null);
});

test("12.5 m building is still calculated", () => {
  const plan = computeSitePlan(extractSitePlanInputs("front setback, 12.5 m high building on a 9 m road"));
  assert.equal(plan.frontM, 3.0);
  assert.equal(plan.note, null);
});

test("no setback question, or no numbers, draws nothing", () => {
  assert.equal(computeSitePlan(extractSitePlanInputs("Show Rule 29 source passage")), null);
  assert.equal(computeSitePlan(extractSitePlanInputs("What is the setback for a building?")), null);
  assert.equal(renderSitePlanSvg({ plotAreaSqm: 100, roadWidthM: 9, frontM: null, rearM: null }), null);
});

test("rear of nil draws no rear band; plot size missing is illustrative", () => {
  const svg = renderSitePlanSvg({ plotAreaSqm: null, roadWidthM: 9, frontM: 3, rearM: 0 });
  assert.doesNotMatch(svg, /Rear open space/);
  assert.match(svg, /Plot size not given \(illustrative\)/);
});

test("every rect except background/outline carries a <title> tooltip", () => {
  const svg = renderSitePlanSvg({ plotAreaSqm: 200, roadWidthM: 9, frontM: 3, rearM: 2.5 });
  const titled = svg.match(/<rect [^>]*><title>/g) ?? [];
  assert.equal(titled.length, 5); // plot, rear, front, zone, road
  assert.match(svg, /<title>Front open space 3 m \(Rule 56\(1\)\(a\)\)<\/title>/);
});
