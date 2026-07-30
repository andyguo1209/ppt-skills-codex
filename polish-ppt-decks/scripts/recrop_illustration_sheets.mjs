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

function parseSheetRows(value) {
  const entries = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, rows] = item.split(":");
      return [name, Number(rows)];
    });
  if (
    entries.length === 0 ||
    entries.some(([name, rows]) => !name || !Number.isInteger(rows) || rows < 1)
  ) {
    throw new Error(
      'Invalid --sheet-rows. Use comma-separated values such as "a:4,b:4,c:5".',
    );
  }
  return Object.fromEntries(entries);
}

function pixelIndex(x, y, width) {
  return y * width + x;
}

function findComponents(data, width, height, options) {
  const visited = new Uint8Array(width * height);
  const components = [];
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],            [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = pixelIndex(x, y, width);
      if (
        visited[start] ||
        data[start * 4 + 3] < options.alphaThreshold
      ) continue;

      const stack = [start];
      visited[start] = 1;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (stack.length > 0) {
        const current = stack.pop();
        const px = current % width;
        const py = Math.floor(current / width);
        area += 1;
        sumX += px;
        sumY += py;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);

        for (const [dx, dy] of neighbors) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbor = pixelIndex(nx, ny, width);
          if (
            visited[neighbor] ||
            data[neighbor * 4 + 3] < options.alphaThreshold
          ) continue;
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }

      if (area < options.minimumComponentPixels) continue;
      components.push({
        area,
        centerX: sumX / area,
        centerY: sumY / area,
        minX,
        minY,
        maxX,
        maxY,
      });
    }
  }
  return components.sort((a, b) => b.area - a.area);
}

function nearestCell(component, width, height, rows, columns) {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  let best = null;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const centerX = (column + 0.5) * cellWidth;
      const centerY = (row + 0.5) * cellHeight;
      const dx = (component.centerX - centerX) / cellWidth;
      const dy = (component.centerY - centerY) / cellHeight;
      const distance = dx * dx + dy * dy;
      if (!best || distance < best.distance) {
        best = { row, column, distance };
      }
    }
  }
  return best;
}

function distanceToComponent(component, anchor) {
  const dx = Math.max(
    anchor.minX - component.maxX,
    component.minX - anchor.maxX,
    0,
  );
  const dy = Math.max(
    anchor.minY - component.maxY,
    component.minY - anchor.maxY,
    0,
  );
  const centerDx = component.centerX - anchor.centerX;
  const centerDy = component.centerY - anchor.centerY;
  return dx * dx + dy * dy + (centerDx * centerDx + centerDy * centerDy) * 0.0001;
}

function unionBounds(components) {
  return components.reduce(
    (bounds, component) => ({
      minX: Math.min(bounds.minX, component.minX),
      minY: Math.min(bounds.minY, component.minY),
      maxX: Math.max(bounds.maxX, component.maxX),
      maxY: Math.max(bounds.maxY, component.maxY),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

const { args, positional } = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(args["input-dir"] ?? positional[0] ?? "");
const outputDir = path.resolve(args["output-dir"] ?? positional[1] ?? "");
if (!inputDir || !outputDir || !args["sheet-rows"]) {
  console.error(
    'Usage: node recrop_illustration_sheets.mjs <sheet-dir> <output-dir> --sheet-rows "a:4,b:4,c:5" [--columns 6] [--sheet-prefix coverage-sheet-]',
  );
  process.exit(2);
}

const options = {
  columns: Number(args.columns ?? 6),
  sheetRows: parseSheetRows(args["sheet-rows"]),
  sheetPrefix: String(args["sheet-prefix"] ?? "coverage-sheet-"),
  alphaThreshold: Number(args["alpha-threshold"] ?? 12),
  minimumComponentPixels: Number(args["minimum-component-pixels"] ?? 8),
  outputSize: Number(args["output-size"] ?? 320),
  outputPadding: Number(args["output-padding"] ?? 24),
  cropPadding: Number(args["crop-padding"] ?? 4),
};

await fs.mkdir(outputDir, { recursive: true });
const report = [];

for (const [sheet, rows] of Object.entries(options.sheetRows)) {
  const sheetPath = path.join(
    inputDir,
    `${options.sheetPrefix}${sheet}.png`,
  );
  const { data, info } = await sharp(sheetPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const components = findComponents(data, info.width, info.height, options);
  const expectedItems = rows * options.columns;
  const mainComponents = components.slice(0, expectedItems);
  const groups = Array.from({ length: expectedItems }, () => []);
  const claimedCells = new Set();

  for (const component of mainComponents) {
    const cell = nearestCell(
      component,
      info.width,
      info.height,
      rows,
      options.columns,
    );
    const cellIndex = cell.row * options.columns + cell.column;
    if (claimedCells.has(cellIndex)) {
      throw new Error(
        `Main-component mapping collision in ${path.basename(sheetPath)}, cell ${cellIndex}`,
      );
    }
    claimedCells.add(cellIndex);
    component.cellIndex = cellIndex;
    groups[cellIndex].push(component);
  }
  if (claimedCells.size !== expectedItems) {
    throw new Error(
      `Expected ${expectedItems} main objects in ${path.basename(sheetPath)}; mapped ${claimedCells.size}`,
    );
  }

  for (const component of components.slice(expectedItems)) {
    const nearestMain = mainComponents.reduce(
      (best, anchor) => {
        const distance = distanceToComponent(component, anchor);
        return !best || distance < best.distance
          ? { anchor, distance }
          : best;
      },
      null,
    );
    groups[nearestMain.anchor.cellIndex].push(component);
  }

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index].sort((a, b) => b.area - a.area);
    const largestArea = group[0]?.area ?? 0;
    const retained = group.filter(
      (component) =>
        component.area >= options.minimumComponentPixels &&
        component.area / Math.max(1, largestArea) >= 0.00035,
    );
    if (retained.length === 0) {
      throw new Error(`No illustration found for ${sheet}-${index}`);
    }
    const bounds = unionBounds(retained);
    const left = Math.max(0, bounds.minX - options.cropPadding);
    const top = Math.max(0, bounds.minY - options.cropPadding);
    const right = Math.min(
      info.width - 1,
      bounds.maxX + options.cropPadding,
    );
    const bottom = Math.min(
      info.height - 1,
      bounds.maxY + options.cropPadding,
    );
    const width = right - left + 1;
    const height = bottom - top + 1;
    const outputPath = path.join(
      outputDir,
      `${sheet}-${String(index).padStart(2, "0")}.png`,
    );
    const innerSize = options.outputSize - options.outputPadding * 2;

    await sharp(sheetPath)
      .extract({ left, top, width, height })
      .resize({
        width: innerSize,
        height: innerSize,
        fit: "contain",
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: options.outputPadding,
        bottom: options.outputPadding,
        left: options.outputPadding,
        right: options.outputPadding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .resize(options.outputSize, options.outputSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outputPath);

    report.push({
      file: path.basename(outputPath),
      sourceSheet: path.basename(sheetPath),
      crop: { left, top, width, height },
      mainComponentPixels: largestArea,
      retainedComponents: retained.length,
    });
  }
}

await fs.writeFile(
  path.join(outputDir, "recrop-report.json"),
  `${JSON.stringify({
    method: "connected-component-main-object",
    version: 1,
    columns: options.columns,
    sheetRows: options.sheetRows,
    inputDir,
    outputDir,
    files: report,
  }, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    { status: "pass", inputDir, outputDir, files: report.length },
    null,
    2,
  ),
);
