#!/usr/bin/env node

import fs from "node:fs/promises";

function usage() {
  console.error(
    "Usage: node render_page_content.mjs <slide-blueprint.json> <page-content.txt> [--check]",
  );
}

function clean(value) {
  return String(value ?? "").trim();
}

function durationLabel(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}分钟`;
  if (seconds > 60) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  return `${seconds}秒`;
}

function renderSlide(slide, index, total) {
  const number = String(slide.number).padStart(2, "0");
  const visible = slide.onSlideContent.map((item) => `- ${clean(item)}`).join("\n");
  const sourceIds = slide.sourceUnitIds.length > 0 ? slide.sourceUnitIds.join(", ") : "无";
  const finalMarker = index === total - 1 ? "[结束]" : "[转场]";

  return [
    `## ${number}｜${clean(slide.title)}`,
    "",
    `[建议时长：${durationLabel(slide.durationSeconds)}]`,
    "",
    "[本页任务]",
    clean(slide.claim),
    "",
    "[屏幕内容]",
    visible,
    "",
    "[现场讲稿]",
    clean(slide.speakerScript),
    "",
    finalMarker,
    clean(slide.transition),
    "",
    "[视觉建议]",
    clean(slide.visualJob),
    "",
    "[来源映射]",
    sourceIds,
  ].join("\n");
}

const [blueprintPath, outputPath, ...flags] = process.argv.slice(2);
if (!blueprintPath || !outputPath) {
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

if (!Array.isArray(blueprint.slides) || blueprint.slides.length === 0) {
  console.error("Blueprint must contain a non-empty `slides` array.");
  process.exit(2);
}

const rendered =
  blueprint.slides
    .map((slide, index) => renderSlide(slide, index, blueprint.slides.length))
    .join("\n\n") + "\n";

if (flags.includes("--check")) {
  let existing;
  try {
    existing = await fs.readFile(outputPath, "utf8");
  } catch (error) {
    console.error(`Cannot read page content for comparison: ${error.message}`);
    process.exit(1);
  }
  if (existing !== rendered) {
    console.error("Page-content check failed: readable script and slide blueprint differ.");
    process.exit(1);
  }
  console.log(`Page-content check passed: ${blueprint.slides.length} page(s).`);
} else {
  await fs.writeFile(outputPath, rendered);
  console.log(`Wrote ${blueprint.slides.length} page(s) to ${outputPath}.`);
}
