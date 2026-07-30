#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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

async function collectPngFiles(root) {
  const files = [];
  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.name.toLowerCase().endsWith(".png")) {
        files.push(entryPath);
      }
    }
  }
  await visit(root);
  return files.sort();
}

function indexFor(x, y, width) {
  return y * width + x;
}

function findAlphaComponents(data, width, height, alphaThreshold, edgeMargin) {
  const visited = new Uint8Array(width * height);
  const components = [];
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],            [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = indexFor(x, y, width);
      if (visited[startIndex] || data[startIndex * 4 + 3] < alphaThreshold) continue;

      const stack = [startIndex];
      const pixels = [];
      visited[startIndex] = 1;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      while (stack.length > 0) {
        const pixelIndex = stack.pop();
        pixels.push(pixelIndex);
        const px = pixelIndex % width;
        const py = Math.floor(pixelIndex / width);
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);

        for (const [dx, dy] of neighbors) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighborIndex = indexFor(nx, ny, width);
          if (
            visited[neighborIndex] ||
            data[neighborIndex * 4 + 3] < alphaThreshold
          ) continue;
          visited[neighborIndex] = 1;
          stack.push(neighborIndex);
        }
      }

      components.push({
        area: pixels.length,
        pixels,
        bbox: [minX, minY, maxX - minX + 1, maxY - minY + 1],
        nearEdge:
          minX <= edgeMargin ||
          minY <= edgeMargin ||
          maxX >= width - 1 - edgeMargin ||
          maxY >= height - 1 - edgeMargin,
      });
    }
  }

  return components.sort((a, b) => b.area - a.area);
}

function maximumRun(flags) {
  let best = 0;
  let current = 0;
  for (const flag of flags) {
    current = flag ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

function inspectMainSubjectEdges(
  component,
  data,
  width,
  height,
  options,
) {
  if (!component) return [];
  const [minX, minY, boxWidth, boxHeight] = component.bbox;
  const maxX = minX + boxWidth - 1;
  const maxY = minY + boxHeight - 1;
  const alphaAt = (x, y) =>
    data[indexFor(x, y, width) * 4 + 3] >= options.alphaThreshold;
  const edges = [
    {
      edge: "top",
      nearBoundary: minY <= options.edgeMargin,
      flags: Array.from({ length: boxWidth }, (_, offset) =>
        alphaAt(minX + offset, minY),
      ),
    },
    {
      edge: "right",
      nearBoundary: maxX >= width - 1 - options.edgeMargin,
      flags: Array.from({ length: boxHeight }, (_, offset) =>
        alphaAt(maxX, minY + offset),
      ),
    },
    {
      edge: "left",
      nearBoundary: minX <= options.edgeMargin,
      flags: Array.from({ length: boxHeight }, (_, offset) =>
        alphaAt(minX, minY + offset),
      ),
    },
  ];

  return edges
    .map(({ edge, nearBoundary, flags }) => {
      const longestRun = maximumRun(flags);
      return {
        edge,
        longestRun,
        edgeLength: flags.length,
        runRatio: longestRun / Math.max(1, flags.length),
        nearBoundary,
      };
    })
    .filter(
      ({ nearBoundary, longestRun, runRatio }) =>
        nearBoundary &&
        longestRun >= options.minimumFlatRunPixels &&
        runRatio >= options.minimumFlatRunRatio,
    );
}

async function inspectPng(filePath, options) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const components = findAlphaComponents(
    data,
    info.width,
    info.height,
    options.alphaThreshold,
    options.edgeMargin,
  );
  const largestArea = components[0]?.area ?? 0;
  const suspicious = components
    .slice(1)
    .filter((component) =>
      component.nearEdge &&
      component.area >= options.minimumPixels &&
      component.area / Math.max(1, largestArea) <= options.maximumRelativeArea,
    );
  const mainSubjectClipping = inspectMainSubjectEdges(
    components[0],
    data,
    info.width,
    info.height,
    options,
  );

  return {
    data,
    info,
    components,
    suspicious,
    mainSubjectClipping,
  };
}

const { args, positional } = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(args["input-dir"] ?? positional[0] ?? "");
const outputDir = args["output-dir"] ? path.resolve(args["output-dir"]) : undefined;
if (!inputDir) {
  console.error(
    "Usage: node validate_illustration_assets.mjs <png-dir> [--output-dir <clean-dir>] [--require-recrop-report] [--alpha-threshold 12] [--edge-margin 24] [--maximum-relative-area 0.15]",
  );
  process.exit(2);
}

const options = {
  alphaThreshold: Number(args["alpha-threshold"] ?? 12),
  edgeMargin: Number(args["edge-margin"] ?? 24),
  minimumPixels: Number(args["minimum-pixels"] ?? 4),
  maximumRelativeArea: Number(args["maximum-relative-area"] ?? 0.15),
  minimumFlatRunPixels: Number(args["minimum-flat-run-pixels"] ?? 36),
  minimumFlatRunRatio: Number(args["minimum-flat-run-ratio"] ?? 0.34),
};

const files = await collectPngFiles(inputDir).catch(() => []);
if (files.length === 0) {
  console.error(`No PNG files found under ${inputDir}`);
  process.exit(2);
}
if (outputDir) await fs.mkdir(outputDir, { recursive: true });

let recropReport = {
  required: Boolean(args["require-recrop-report"]),
  status: "not-required",
  path: path.join(inputDir, "recrop-report.json"),
  problems: [],
};
if (recropReport.required) {
  try {
    const parsed = JSON.parse(await fs.readFile(recropReport.path, "utf8"));
    const reportedFiles = Array.isArray(parsed.files) ? parsed.files : [];
    const actualNames = new Set(files.map((filePath) => path.basename(filePath)));
    const reportedNames = new Set(
      reportedFiles.map((entry) => entry?.file).filter(Boolean),
    );
    if (parsed.method !== "connected-component-main-object") {
      recropReport.problems.push(
        "method must be connected-component-main-object",
      );
    }
    if (parsed.version !== 1) {
      recropReport.problems.push("version must be 1");
    }
    if (reportedFiles.length !== files.length) {
      recropReport.problems.push(
        `report lists ${reportedFiles.length} files but directory contains ${files.length} PNG files`,
      );
    }
    for (const actualName of actualNames) {
      if (!reportedNames.has(actualName)) {
        recropReport.problems.push(`missing report entry for ${actualName}`);
      }
    }
    for (const entry of reportedFiles) {
      const crop = entry?.crop;
      if (
        !entry?.sourceSheet ||
        !crop ||
        !Number.isFinite(crop.left) ||
        !Number.isFinite(crop.top) ||
        !Number.isFinite(crop.width) ||
        !Number.isFinite(crop.height) ||
        crop.width <= 0 ||
        crop.height <= 0
      ) {
        recropReport.problems.push(
          `invalid crop provenance for ${entry?.file ?? "unknown file"}`,
        );
      }
    }
    recropReport.status =
      recropReport.problems.length === 0 ? "pass" : "fail";
  } catch (error) {
    recropReport.status = "fail";
    recropReport.problems.push(
      `cannot read valid recrop-report.json: ${error.message}`,
    );
  }
}

const issues = [];
const clippingIssues = [];
for (const filePath of files) {
  const result = await inspectPng(filePath, options);
  if (result.suspicious.length > 0) {
    issues.push({
      file: filePath,
      largestComponentPixels: result.components[0]?.area ?? 0,
      edgeFragments: result.suspicious.map(({ area, bbox }) => ({ area, bbox })),
    });
  }
  if (result.mainSubjectClipping.length > 0) {
    clippingIssues.push({
      file: filePath,
      mainComponentPixels: result.components[0]?.area ?? 0,
      mainComponentBbox: result.components[0]?.bbox,
      suspiciousFlatEdges: result.mainSubjectClipping,
    });
  }

  if (outputDir) {
    const relative = path.relative(inputDir, filePath);
    const outputPath = path.join(outputDir, relative);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    for (const component of result.suspicious) {
      for (const pixelIndex of component.pixels) {
        result.data[pixelIndex * 4 + 3] = 0;
      }
    }
    await sharp(result.data, {
      raw: {
        width: result.info.width,
        height: result.info.height,
        channels: 4,
      },
    }).png().toFile(outputPath);
  }
}

const report = {
  status:
    recropReport.status === "fail" ||
    clippingIssues.length > 0 ||
    (issues.length > 0 && !outputDir)
      ? "fail"
      : "pass",
  inputDir,
  outputDir,
  checkedFiles: files.length,
  filesWithDetachedEdgeFragments: issues.length,
  cleanedFragments: issues.reduce(
    (sum, issue) => sum + issue.edgeFragments.length,
    0,
  ),
  filesWithPossibleMainSubjectClipping: clippingIssues.length,
  recropReport,
  issues,
  clippingIssues,
};

const serialized = JSON.stringify(report, null, 2);
if (
  recropReport.status === "fail" ||
  clippingIssues.length > 0 ||
  (issues.length > 0 && !outputDir)
) {
  console.error(serialized);
  process.exit(1);
}
console.log(serialized);
