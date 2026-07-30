#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[token.slice(2)] = true;
      continue;
    }
    args[token.slice(2)] = value;
    index += 1;
  }
  return { args, positional };
}

async function collectLayoutFiles(root) {
  const files = [];
  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.name.endsWith(".layout.json")) {
        files.push(entryPath);
      }
    }
  }
  await visit(root);
  return files.sort();
}

function isCompactNumericToken(text, name) {
  if (/^\d{2}$/.test(text)) return true;
  if (/^\d{1,4}(?:%|‰|万|亿|条|人天)$/.test(text)) return true;
  return /(number|badge|step|index|[-_]no[-_])/i.test(name) && /\d/.test(text) && text.length <= 4;
}

function inspectElement(element, slideNumber, filePath) {
  const text = String(element.text ?? element.textPreview ?? "").trim();
  const name = String(element.name ?? "");
  if (!text || !isCompactNumericToken(text, name)) return [];

  const issues = [];
  const lineCount = Number(element.textLayout?.lineCount ?? 1);
  const bbox = Array.isArray(element.bbox) ? element.bbox.map(Number) : [];
  const width = bbox.length === 4 ? bbox[2] : undefined;

  if (lineCount > 1) {
    issues.push({
      slide: slideNumber,
      id: "compact-token-wrapped",
      name,
      text,
      lineCount,
      file: filePath,
      message: `Compact token "${text}" rendered on ${lineCount} lines.`,
    });
  }

  if (Number.isFinite(width) && width < 48) {
    issues.push({
      slide: slideNumber,
      id: "compact-token-box-too-narrow",
      name,
      text,
      width,
      minimumWidth: 48,
      file: filePath,
      message: `Compact token "${text}" uses a ${width}px text box; use at least 48px.`,
    });
  }

  return issues;
}

function repeatedGroupKey(name) {
  const slideScoped = name.match(
    /^(fresh-(?:question-card|statement-item|card|formula|process-node|closing-card)-\d+)-(\d+)$/,
  );
  if (slideScoped) return slideScoped[1];

  const pageScoped = name.match(/^(fresh-qna-card)-(\d+)$/);
  return pageScoped ? pageScoped[1] : undefined;
}

function inspectRepeatedGroups(layout, slideNumber, filePath) {
  const frame = layout.slide?.frame ?? {};
  const frameLeft = Number(frame.left ?? 0);
  const frameWidth = Number(frame.width);
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return [];

  const groups = new Map();
  for (const element of layout.elements ?? []) {
    const name = String(element.name ?? "");
    const key = repeatedGroupKey(name);
    const bbox = Array.isArray(element.bbox) ? element.bbox.map(Number) : [];
    if (!key || bbox.length !== 4 || bbox.some((value) => !Number.isFinite(value))) continue;
    const members = groups.get(key) ?? [];
    members.push({ name, bbox });
    groups.set(key, members);
  }

  const issues = [];
  const frameCenter = frameLeft + frameWidth / 2;
  const tolerance = 24;
  for (const [group, members] of groups.entries()) {
    if (members.length < 2) continue;
    const left = Math.min(...members.map(({ bbox }) => bbox[0]));
    const right = Math.max(...members.map(({ bbox }) => bbox[0] + bbox[2]));
    const groupCenter = (left + right) / 2;
    const delta = groupCenter - frameCenter;
    if (Math.abs(delta) <= tolerance) continue;

    issues.push({
      slide: slideNumber,
      id: "repeated-group-off-center",
      group,
      memberCount: members.length,
      groupBounds: [left, right],
      frameCenter,
      groupCenter,
      delta,
      tolerance,
      file: filePath,
      message: `Repeated peer group "${group}" is offset ${delta}px from the slide center.`,
    });
  }
  return issues;
}

function inspectComparisonDensity(layout, slideNumber, filePath) {
  const elements = layout.elements ?? [];
  const byName = new Map(elements.map((element) => [String(element.name ?? ""), element]));
  const issues = [];
  const minimumIllustrationAreaRatio = 0.1;

  for (const panel of elements) {
    const panelName = String(panel.name ?? "");
    const match = panelName.match(/^fresh-compare-panel-(\d+)-(\d+)$/);
    if (!match) continue;
    const illustrationName = `fresh-comparison-illustration-${match[1]}-${match[2]}`;
    const illustration = byName.get(illustrationName);
    if (!illustration) continue;

    const panelBox = Array.isArray(panel.bbox) ? panel.bbox.map(Number) : [];
    const illustrationBox = Array.isArray(illustration.bbox) ? illustration.bbox.map(Number) : [];
    if (
      panelBox.length !== 4 ||
      illustrationBox.length !== 4 ||
      panelBox.some((value) => !Number.isFinite(value)) ||
      illustrationBox.some((value) => !Number.isFinite(value))
    ) continue;

    const panelArea = panelBox[2] * panelBox[3];
    const illustrationArea = illustrationBox[2] * illustrationBox[3];
    const areaRatio = panelArea > 0 ? illustrationArea / panelArea : 0;
    if (areaRatio >= minimumIllustrationAreaRatio) continue;

    issues.push({
      slide: slideNumber,
      id: "comparison-card-visually-sparse",
      panel: panelName,
      illustration: illustrationName,
      areaRatio,
      minimumIllustrationAreaRatio,
      file: filePath,
      message: `Illustration fills only ${(areaRatio * 100).toFixed(1)}% of comparison panel "${panelName}".`,
    });
  }
  return issues;
}

function boxesIntersect(a, b) {
  return !(
    a[0] + a[2] <= b[0] ||
    b[0] + b[2] <= a[0] ||
    a[1] + a[3] <= b[1] ||
    b[1] + b[3] <= a[1]
  );
}

function intersectionArea(a, b) {
  const left = Math.max(a[0], b[0]);
  const top = Math.max(a[1], b[1]);
  const right = Math.min(a[0] + a[2], b[0] + b[2]);
  const bottom = Math.min(a[1] + a[3], b[1] + b[3]);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function intersectionBox(a, b) {
  const left = Math.max(a[0], b[0]);
  const top = Math.max(a[1], b[1]);
  const right = Math.min(a[0] + a[2], b[0] + b[2]);
  const bottom = Math.min(a[1] + a[3], b[1] + b[3]);
  return [
    left,
    top,
    Math.max(0, right - left),
    Math.max(0, bottom - top),
  ];
}

function estimatedVisualWidth(text, fontPx) {
  let units = 0;
  for (const char of text) {
    if (/\s/.test(char)) units += 0.34;
    else if (/[\u2E80-\u9FFF\uF900-\uFAFF]/u.test(char)) units += 1;
    else if (/[A-Z0-9%≈]/.test(char)) units += 0.68;
    else if (/[a-z]/.test(char)) units += 0.56;
    else units += 0.45;
  }
  return units * fontPx;
}

function approximateTextInkBox(element) {
  const box = Array.isArray(element.bbox) ? element.bbox.map(Number) : [];
  if (box.length !== 4 || box.some((value) => !Number.isFinite(value))) return undefined;
  const text = String(element.text ?? "").trim();
  if (!text) return undefined;

  const lines = element.textLayout?.lines?.map((line) => String(line.text ?? "")) ?? [text];
  const runSizes = (element.paragraphs ?? [])
    .flatMap((paragraph) => paragraph.runs ?? [])
    .map((run) => Number(run.fontSize))
    .filter(Number.isFinite);
  const fontPx =
    (runSizes.length ? Math.max(...runSizes) : Number(element.resolvedFontSize ?? 14)) * 4 / 3;
  const inkWidth = Math.min(
    box[2],
    Math.max(...lines.map((line) => estimatedVisualWidth(line, fontPx))),
  );
  const inkHeight = Math.min(
    box[3],
    Math.max(fontPx * 1.08, box[3] / Math.max(1, lines.length)),
  );
  const alignment =
    element.paragraphs?.[0]?.resolvedTextStyle?.alignment ??
    element.resolvedTextStyle?.alignment ??
    "left";

  let left = box[0];
  if (alignment === "center") left = box[0] + (box[2] - inkWidth) / 2;
  if (alignment === "right") left = box[0] + box[2] - inkWidth;
  const top = box[1] + (box[3] - inkHeight) / 2;
  return [left, top, inkWidth, inkHeight];
}

function inspectIllustrationTextOverlap(layout, slideNumber, filePath) {
  const elements = layout.elements ?? [];
  const illustrations = elements.filter((element) =>
    /(?:illustration|visual|hero)/i.test(String(element.name ?? "")) &&
    /image/i.test(String(element.kind ?? element.type ?? element.geometry ?? "")),
  );
  const compactReadableTexts = elements.filter((element) => {
    const text = String(element.text ?? "");
    const compactText = text.replace(/\s+/g, "");
    return (
      compactText.length > 0 &&
      compactText.length <= 16 &&
      !text.includes("\n") &&
      /shape|text/i.test(String(element.kind ?? element.type ?? element.geometry ?? ""))
    );
  });
  const issues = [];

  for (const illustration of illustrations) {
    const imageBox = Array.isArray(illustration.bbox) ? illustration.bbox.map(Number) : [];
    if (imageBox.length !== 4 || imageBox.some((value) => !Number.isFinite(value))) continue;
    for (const textElement of compactReadableTexts) {
      if (Number(illustration.order ?? 0) <= Number(textElement.order ?? 0)) continue;
      const inkBox = approximateTextInkBox(textElement);
      if (!inkBox) continue;
      const overlap = intersectionBox(imageBox, inkBox);
      const horizontalCoverage = overlap[2] / Math.max(1, inkBox[2]);
      const verticalCoverage = overlap[3] / Math.max(1, inkBox[3]);
      if (horizontalCoverage < 0.4 || verticalCoverage < 0.7) continue;
      issues.push({
        slide: slideNumber,
        id: "illustration-covers-readable-text",
        illustration: String(illustration.name ?? ""),
        text: String(textElement.text ?? ""),
        imageBox,
        inkBox,
        horizontalCoverage,
        verticalCoverage,
        file: filePath,
        message: `Illustration "${String(illustration.name ?? "")}" covers readable text "${String(textElement.text ?? "")}". Move or resize the illustration; do not hide the text.`,
      });
    }
  }
  return issues;
}

function inspectIllustrationOcclusion(layout, slideNumber, filePath) {
  const elements = layout.elements ?? [];
  const illustrations = elements.filter((element) =>
    /(?:illustration|visual|hero)/i.test(String(element.name ?? "")) &&
    /image/i.test(String(element.kind ?? element.type ?? element.geometry ?? "")),
  );
  const masks = elements.filter((element) =>
    /(?:artifact|illustration|image)[-_]?(?:top[-_]|bottom[-_]|center[-_])?mask|artifact-mask/i.test(
      String(element.name ?? ""),
    ),
  );
  const issues = [];

  for (const illustration of illustrations) {
    const illustrationBox = Array.isArray(illustration.bbox)
      ? illustration.bbox.map(Number)
      : [];
    if (
      illustrationBox.length !== 4 ||
      illustrationBox.some((value) => !Number.isFinite(value))
    ) continue;
    const illustrationArea = illustrationBox[2] * illustrationBox[3];
    if (illustrationArea <= 0) continue;

    for (const mask of masks) {
      const maskBox = Array.isArray(mask.bbox) ? mask.bbox.map(Number) : [];
      if (maskBox.length !== 4 || maskBox.some((value) => !Number.isFinite(value))) continue;
      const coveredRatio = intersectionArea(illustrationBox, maskBox) / illustrationArea;
      if (coveredRatio < 0.02) continue;
      issues.push({
        slide: slideNumber,
        id: "illustration-obscured-by-mask",
        illustration: String(illustration.name ?? ""),
        mask: String(mask.name ?? ""),
        coveredRatio,
        maximumCoveredRatio: 0.02,
        file: filePath,
        message: `Mask "${String(mask.name ?? "")}" covers ${(coveredRatio * 100).toFixed(1)}% of illustration "${String(illustration.name ?? "")}". Clean or replace the source bitmap instead of covering it.`,
      });
    }
  }

  return issues;
}

function inspectHubGeometry(layout, slideNumber, filePath) {
  const elements = layout.elements ?? [];
  const core = elements.find((element) =>
    new RegExp(`^fresh-hub-core-${slideNumber}$`).test(String(element.name ?? "")),
  );
  if (!core) return [];

  const nodes = elements.filter((element) =>
    new RegExp(`^fresh-hub-node-${slideNumber}-\\d+$`).test(String(element.name ?? "")),
  );
  const links = elements.filter((element) =>
    new RegExp(`^fresh-hub-link-${slideNumber}-\\d+$`).test(String(element.name ?? "")),
  );
  const issues = [];

  if (
    links.length !== nodes.length ||
    links.some((link) => !/connector/i.test(String(link.geometry ?? "")))
  ) {
    issues.push({
      slide: slideNumber,
      id: "hub-links-not-radial-connectors",
      nodeCount: nodes.length,
      linkCount: links.length,
      linkGeometries: links.map((link) => String(link.geometry ?? "")),
      file: filePath,
      message: "Hub nodes must use one native connector per node, not axis-spanning rectangles or unrelated lines.",
    });
  }

  const coreBox = Array.isArray(core.bbox) ? core.bbox.map(Number) : [];
  if (coreBox.length === 4 && coreBox.every((value) => Number.isFinite(value))) {
    const padding = 16;
    const safeBox = [
      coreBox[0] - padding,
      coreBox[1] - padding,
      coreBox[2] + padding * 2,
      coreBox[3] + padding * 2,
    ];
    const overlappingNodes = nodes
      .filter((node) => {
        const box = Array.isArray(node.bbox) ? node.bbox.map(Number) : [];
        return box.length === 4 && box.every((value) => Number.isFinite(value)) && boxesIntersect(safeBox, box);
      })
      .map((node) => String(node.name ?? ""));
    if (overlappingNodes.length > 0) {
      issues.push({
        slide: slideNumber,
        id: "hub-center-safe-zone-violated",
        core: String(core.name ?? ""),
        padding,
        overlappingNodes,
        file: filePath,
        message: `Hub nodes enter the ${padding}px center safe zone.`,
      });
    }
  }

  return issues;
}

const { args, positional } = parseArgs(process.argv.slice(2));
const layoutDir = path.resolve(args["layout-dir"] ?? positional[0] ?? "");
if (!layoutDir) {
  console.error("Usage: node validate_visual_details.mjs <final-layout-dir>");
  process.exit(2);
}

const layoutFiles = await collectLayoutFiles(layoutDir).catch(() => []);
if (layoutFiles.length === 0) {
  console.error(`No .layout.json files found under ${layoutDir}`);
  process.exit(2);
}

const issues = [];
for (const filePath of layoutFiles) {
  const layout = JSON.parse(await fs.readFile(filePath, "utf8"));
  const slideNumber = layout.slide?.slide ?? path.basename(filePath);
  for (const element of layout.elements ?? []) {
    issues.push(...inspectElement(element, slideNumber, filePath));
  }
  issues.push(...inspectRepeatedGroups(layout, slideNumber, filePath));
  issues.push(...inspectComparisonDensity(layout, slideNumber, filePath));
  issues.push(...inspectIllustrationTextOverlap(layout, slideNumber, filePath));
  issues.push(...inspectIllustrationOcclusion(layout, slideNumber, filePath));
  issues.push(...inspectHubGeometry(layout, slideNumber, filePath));
}

if (issues.length > 0) {
  console.error(JSON.stringify({
    status: "fail",
    layoutDir,
    checkedLayouts: layoutFiles.length,
    issueCount: issues.length,
    issues,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "pass",
  layoutDir,
  checkedLayouts: layoutFiles.length,
  issueCount: 0,
}, null, 2));
