import { FileBlob, PresentationFile } from "@oai/artifact-tool";

function parseArgs(argv) {
  const args = { allow: new Set() };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--allow-image-content") {
      const value = argv[index + 1] ?? "";
      for (const item of value.split(",")) {
        const slide = Number(item.trim());
        if (Number.isInteger(slide) && slide > 0) args.allow.add(slide);
      }
      index += 1;
    } else if (!args.pptx) {
      args.pptx = token;
    }
  }
  return args;
}

function area(bbox = []) {
  return Math.max(0, bbox[2] ?? 0) * Math.max(0, bbox[3] ?? 0);
}

function isCanvasCandidate(record) {
  const [left = 0, top = 0, width = 0, height = 0] = record.bbox ?? [];
  return left <= 2 && top <= 2 && width >= 400 && height >= 225;
}

const args = parseArgs(process.argv.slice(2));
if (!args.pptx) {
  throw new Error(
    "Usage: node validate_editability.mjs <deck.pptx> [--allow-image-content 12,18]",
  );
}

const presentation = await PresentationFile.importPptx(
  await FileBlob.load(args.pptx),
);
const snapshot = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart",
  maxChars: 2_000_000,
});
const records = snapshot.ndjson
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const slideCount = presentation.slides.items.length;
const failures = [];
const summaries = [];

for (let slide = 1; slide <= slideCount; slide += 1) {
  const items = records.filter((record) => record.slide === slide);
  const canvasCandidates = items.filter(isCanvasCandidate);
  const canvas =
    canvasCandidates.sort((a, b) => area(b.bbox) - area(a.bbox))[0] ?? {
      bbox: [0, 0, 1280, 720],
    };
  const canvasArea = area(canvas.bbox) || 1280 * 720;
  const [, , canvasWidth = 1280, canvasHeight = 720] = canvas.bbox;

  const textItems = items.filter(
    (record) =>
      (record.kind === "textbox" || record.kind === "shape") &&
      Number(record.textChars ?? 0) > 0,
  );
  const editableTextChars = textItems.reduce(
    (sum, record) => sum + Number(record.textChars ?? 0),
    0,
  );
  const nativeStructures = items.filter((record) =>
    ["shape", "table", "chart"].includes(record.kind),
  );
  const largeImages = items.filter(
    (record) =>
      record.kind === "image" &&
      isCanvasCandidate(record) &&
      area(record.bbox) / canvasArea >= 0.8,
  );
  const largeContentBitmaps = items.filter((record) => {
    if (record.kind !== "image") return false;
    const [left = 0, top = 0, width = 0, height = 0] = record.bbox ?? [];
    const coverage = area(record.bbox) / canvasArea;
    const exactBackground =
      left <= 2 &&
      top <= 2 &&
      width >= canvasWidth * 0.95 &&
      height >= canvasHeight * 0.95;
    return (
      !exactBackground &&
      coverage >= 0.5 &&
      width >= canvasWidth * 0.85 &&
      height >= canvasHeight * 0.45
    );
  });

  const likelyFlattened =
    largeContentBitmaps.length > 0 ||
    (largeImages.length > 0 &&
      textItems.length < 2 &&
      editableTextChars < 20 &&
      nativeStructures.length < 2);

  summaries.push({
    slide,
    editableTextObjects: textItems.length,
    editableTextChars,
    nativeStructures: nativeStructures.length,
    largeImages: largeImages.length,
    largeContentBitmaps: largeContentBitmaps.length,
  });

  if (likelyFlattened && !args.allow.has(slide)) {
    failures.push(
      `slide ${slide}: likely flattened or image-based content; ` +
        `${largeContentBitmaps.length} large content bitmap(s), ` +
        `${largeImages.length} near-full-slide image(s), ${textItems.length} editable text object(s), ` +
        `${nativeStructures.length} native structure(s)`,
    );
  }
}

const totalEditableText = summaries.reduce(
  (sum, slide) => sum + slide.editableTextObjects,
  0,
);
console.log(
  `Editability scan: ${slideCount} slides, ${totalEditableText} editable text objects.`,
);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Editability validation passed: no likely flattened content slides.");
}
