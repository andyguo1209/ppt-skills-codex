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

  return {
    data,
    info,
    components,
    suspicious,
  };
}

const { args, positional } = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(args["input-dir"] ?? positional[0] ?? "");
const outputDir = args["output-dir"] ? path.resolve(args["output-dir"]) : undefined;
if (!inputDir) {
  console.error(
    "Usage: node validate_illustration_assets.mjs <png-dir> [--output-dir <clean-dir>] [--alpha-threshold 12] [--edge-margin 24] [--maximum-relative-area 0.15]",
  );
  process.exit(2);
}

const options = {
  alphaThreshold: Number(args["alpha-threshold"] ?? 12),
  edgeMargin: Number(args["edge-margin"] ?? 24),
  minimumPixels: Number(args["minimum-pixels"] ?? 4),
  maximumRelativeArea: Number(args["maximum-relative-area"] ?? 0.15),
};

const files = await collectPngFiles(inputDir).catch(() => []);
if (files.length === 0) {
  console.error(`No PNG files found under ${inputDir}`);
  process.exit(2);
}
if (outputDir) await fs.mkdir(outputDir, { recursive: true });

const issues = [];
for (const filePath of files) {
  const result = await inspectPng(filePath, options);
  if (result.suspicious.length > 0) {
    issues.push({
      file: filePath,
      largestComponentPixels: result.components[0]?.area ?? 0,
      edgeFragments: result.suspicious.map(({ area, bbox }) => ({ area, bbox })),
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
  status: issues.length > 0 && !outputDir ? "fail" : "pass",
  inputDir,
  outputDir,
  checkedFiles: files.length,
  filesWithDetachedEdgeFragments: issues.length,
  cleanedFragments: issues.reduce(
    (sum, issue) => sum + issue.edgeFragments.length,
    0,
  ),
  issues,
};

const serialized = JSON.stringify(report, null, 2);
if (issues.length > 0 && !outputDir) {
  console.error(serialized);
  process.exit(1);
}
console.log(serialized);
