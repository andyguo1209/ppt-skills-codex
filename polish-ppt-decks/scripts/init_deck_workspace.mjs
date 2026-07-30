import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.workspace) throw new Error("Required argument missing: --workspace");

const workspace = path.resolve(args.workspace);
await fs.mkdir(workspace, { recursive: true });
for (const dir of ["assets", "final-render", "final-layout", "qa", "pipeline"]) {
  await fs.mkdir(path.join(workspace, dir), { recursive: true });
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
for (const fileName of [
  "helpers.mjs",
  "render_page_content.mjs",
  "run_transform.mjs",
  "validate_content_plan.mjs",
  "validate_prompter.mjs",
  "validate_editability.mjs",
  "validate_visual_details.mjs",
]) {
  await fs.copyFile(
    path.join(scriptDir, fileName),
    path.join(workspace, "pipeline", fileName),
  );
}

if (args.source) {
  await fs.copyFile(path.resolve(args.source), path.join(workspace, "source.pptx"));
}

const textFiles = {
  "input-role-map.txt":
    "Classify each supplied file as CONTENT SOURCE, TEMPLATE SOURCE, or STYLE-ONLY REFERENCE.\\n",
  "source-notes.txt": "Source and claim provenance\n",
  "communication-brief.txt":
    "Audience:\nDeck job:\nAudience outcome:\nCentral takeaway:\nDuration:\nLanguage and tone:\nConstraints:\n",
  "prompt-record.txt": "Image generation prompts and selected outputs\n",
  "deviation-log.txt": "Intentional departures from inherited template slides\n",
};
for (const [name, initial] of Object.entries(textFiles)) {
  const filePath = path.join(workspace, name);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, initial);
  }
}

const transformPath = path.join(workspace, "transform.mjs");
try {
  await fs.access(transformPath);
} catch {
  await fs.writeFile(
    transformPath,
    `export default async function transform({ presentation, workspace, helpers }) {
  // Inspect inherited names/ids before editing.
  // Example:
  // const slide = presentation.slides.getItem(0);
  // helpers.findShape(slide, "cover-title").text = "Updated title";
}
`,
  );
}

console.log(workspace);
