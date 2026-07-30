import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const pptxPath = process.argv[2];
if (!pptxPath) {
  throw new Error("Usage: node validate_prompter.mjs <deck.pptx>");
}

const presentation = await PresentationFile.importPptx(
  await FileBlob.load(pptxPath),
);
const snapshot = await presentation.inspect({
  kind: "notes",
  maxChars: 1_000_000,
});
const records = snapshot.ndjson
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const failures = [];
for (let slide = 1; slide <= presentation.slides.items.length; slide += 1) {
  const note = records.find((record) => record.slide === slide);
  const text = note?.text ?? "";
  if (!text.includes("[现场讲稿]")) failures.push(`slide ${slide}: missing 现场讲稿`);
  if (!/\[(转场|结束)\]/.test(text)) failures.push(`slide ${slide}: missing 转场/结束`);
  if (/\[本页目的\]|\[建议时长|\[Sources\]/.test(text)) {
    failures.push(`slide ${slide}: contains non-prompter metadata`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Prompter validation passed for ${presentation.slides.items.length} slides.`);
}
