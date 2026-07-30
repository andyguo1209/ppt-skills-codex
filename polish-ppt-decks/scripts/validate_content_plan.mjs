#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function usage() {
  console.error("Usage: node validate_content_plan.mjs <slide-blueprint.json>");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function label(item, fallback) {
  return isNonEmptyString(item?.id) ? item.id : fallback;
}

const blueprintPath = process.argv[2];
if (!blueprintPath) {
  usage();
  process.exit(2);
}

let blueprint;
try {
  blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));
} catch (error) {
  console.error(`Cannot read valid JSON from ${blueprintPath}: ${error.message}`);
  process.exit(2);
}

const failures = [];
const warnings = [];
const units = Array.isArray(blueprint.contentUnits) ? blueprint.contentUnits : [];
const slides = Array.isArray(blueprint.slides) ? blueprint.slides : [];

if (blueprint.version !== 1) failures.push("Root field `version` must equal 1.");
if (!isNonEmptyString(blueprint.communicationJob)) {
  failures.push("Root field `communicationJob` must be a non-empty string.");
}
if (!Array.isArray(blueprint.contentUnits)) failures.push("Root field `contentUnits` must be an array.");
if (!Array.isArray(blueprint.slides) || slides.length === 0) {
  failures.push("Root field `slides` must be a non-empty array.");
}

const unitById = new Map();
for (const [index, unit] of units.entries()) {
  const unitLabel = label(unit, `contentUnits[${index}]`);
  if (!isNonEmptyString(unit?.id)) {
    failures.push(`${unitLabel}: missing non-empty \`id\`.`);
    continue;
  }
  if (unitById.has(unit.id)) failures.push(`${unitLabel}: duplicate content-unit ID.`);
  unitById.set(unit.id, unit);
  if (!isNonEmptyString(unit.source)) failures.push(`${unitLabel}: missing source provenance.`);
  if (!isNonEmptyString(unit.kind)) failures.push(`${unitLabel}: missing \`kind\`.`);
  if (!isNonEmptyString(unit.text)) failures.push(`${unitLabel}: missing content text.`);
  if (typeof unit.required !== "boolean") failures.push(`${unitLabel}: \`required\` must be boolean.`);
}

const mappedCounts = new Map();
const slideNumbers = new Set();
const sourceOptionalKinds = new Set(["cover", "divider", "agenda", "q&a", "qa", "thank-you", "closing"]);

for (const [index, slide] of slides.entries()) {
  const slideLabel = `slides[${index}]`;
  if (!Number.isInteger(slide?.number) || slide.number < 1) {
    failures.push(`${slideLabel}: \`number\` must be a positive integer.`);
  } else {
    if (slideNumbers.has(slide.number)) failures.push(`${slideLabel}: duplicate slide number ${slide.number}.`);
    slideNumbers.add(slide.number);
  }

  for (const field of ["kind", "title", "claim", "layoutIntent", "visualJob"]) {
    if (!isNonEmptyString(slide?.[field])) failures.push(`${slideLabel}: missing non-empty \`${field}\`.`);
  }

  if (!Array.isArray(slide?.sourceUnitIds)) {
    failures.push(`${slideLabel}: \`sourceUnitIds\` must be an array.`);
    continue;
  }

  const uniqueIds = new Set();
  for (const unitId of slide.sourceUnitIds) {
    if (!isNonEmptyString(unitId)) {
      failures.push(`${slideLabel}: source-unit IDs must be non-empty strings.`);
      continue;
    }
    if (uniqueIds.has(unitId)) warnings.push(`${slideLabel}: source unit ${unitId} is repeated on the same slide.`);
    uniqueIds.add(unitId);
    if (!unitById.has(unitId)) {
      failures.push(`${slideLabel}: references unknown content unit ${unitId}.`);
      continue;
    }
    mappedCounts.set(unitId, (mappedCounts.get(unitId) ?? 0) + 1);
  }

  const normalizedKind = isNonEmptyString(slide.kind) ? slide.kind.trim().toLowerCase() : "";
  if (slide.sourceUnitIds.length === 0 && !sourceOptionalKinds.has(normalizedKind)) {
    failures.push(`${slideLabel}: ${slide.kind || "content"} slide has no mapped source units.`);
  }
  if (slide.sourceUnitIds.length > 6) {
    warnings.push(`${slideLabel}: maps ${slide.sourceUnitIds.length} content units; review for excessive density.`);
  }
}

if (slideNumbers.size === slides.length && slides.length > 0) {
  const sorted = [...slideNumbers].sort((a, b) => a - b);
  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    if (sorted[index] !== expected) {
      failures.push(`Slide numbers must be sequential from 1; expected ${expected}, found ${sorted[index]}.`);
      break;
    }
  }
}

for (const unit of units) {
  if (!isNonEmptyString(unit?.id)) continue;
  const count = mappedCounts.get(unit.id) ?? 0;
  if (unit.required === true && count === 0) failures.push(`${unit.id}: required content unit is not mapped to any slide.`);
  if (count > 2) warnings.push(`${unit.id}: mapped to ${count} slides; review for unnecessary repetition.`);
}

for (const warning of warnings) console.warn(`WARNING: ${warning}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Content-plan validation failed with ${failures.length} error(s).`);
  process.exit(1);
}

console.log(
  `Content-plan validation passed: ${slides.length} slide(s), ${units.length} content unit(s), ${path.basename(blueprintPath)}.`,
);
