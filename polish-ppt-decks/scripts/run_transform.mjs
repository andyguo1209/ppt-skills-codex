import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";
import * as helpers from "./helpers.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }
    args[token.slice(2)] = value;
    index += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
for (const key of ["starter", "transform", "workspace", "out"]) {
  if (!args[key]) throw new Error(`Required argument missing: --${key}`);
}

const starter = path.resolve(args.starter);
const transformPath = path.resolve(args.transform);
const workspace = path.resolve(args.workspace);
const outputPath = path.resolve(args.out);
await fs.mkdir(workspace, { recursive: true });
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const presentation = await PresentationFile.importPptx(
  await FileBlob.load(starter),
);
const moduleUrl = `${pathToFileURL(transformPath).href}?v=${Date.now()}`;
const transformModule = await import(moduleUrl);
const transform = transformModule.default ?? transformModule.transform;
if (typeof transform !== "function") {
  throw new Error("Transform module must export a default function or transform()");
}

await transform({ presentation, workspace, helpers });
await helpers.exportQaArtifacts(presentation, workspace);

const inspection = await presentation.inspect({
  kind: "deck,slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 2_000_000,
});
await fs.writeFile(`${outputPath}.inspect.ndjson`, inspection.ndjson);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(outputPath);
console.log(outputPath);
