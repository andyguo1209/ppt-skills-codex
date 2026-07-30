#!/usr/bin/env node

import fs from "node:fs/promises";

const knownGates = new Set([
  "scope-brief",
  "talk-script",
  "page-content",
  "template-style",
  "style-proof",
  "one-shot-override",
]);

function usage() {
  console.error(
    "Usage: node validate_approval_ledger.mjs <approval-ledger.txt> --require gate-a,gate-b",
  );
}

function parseArgs(argv) {
  const result = { ledgerPath: argv[0], required: [] };
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--require") {
      result.required = (argv[index + 1] ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
if (!args.ledgerPath || args.required.length === 0) {
  usage();
  process.exit(2);
}

for (const gate of args.required) {
  if (!knownGates.has(gate)) {
    console.error(`Unknown approval gate: ${gate}`);
    process.exit(2);
  }
}

let ledgerText;
try {
  ledgerText = await fs.readFile(args.ledgerPath, "utf8");
} catch (error) {
  console.error(`Cannot read approval ledger: ${error.message}`);
  process.exit(1);
}

const states = new Map();
for (const rawLine of ledgerText.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const match = line.match(/^([a-z-]+)\s*=\s*(approved|pending|rejected)$/i);
  if (!match) {
    console.error(`Invalid ledger line: ${rawLine}`);
    process.exit(1);
  }
  const gate = match[1].toLowerCase();
  if (!knownGates.has(gate)) {
    console.error(`Unknown gate in ledger: ${gate}`);
    process.exit(1);
  }
  states.set(gate, match[2].toLowerCase());
}

if (states.get("one-shot-override") === "approved") {
  console.log("Approval validation passed through explicit one-shot override.");
  process.exit(0);
}

const failures = [];
for (const gate of args.required) {
  const state = states.get(gate) ?? "missing";
  if (state !== "approved") failures.push(`${gate}=${state}`);
}

if (failures.length > 0) {
  console.error(`Approval validation failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`Approval validation passed: ${args.required.join(", ")}.`);
