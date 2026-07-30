import fs from "node:fs/promises";
import path from "node:path";

export async function readBytes(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

export function findShape(slide, name) {
  const shape = slide.shapes.items.find((item) => item.name === name);
  if (!shape) throw new Error(`Missing shape: ${name}`);
  return shape;
}

export function hideShape(shape, { clearText = false } = {}) {
  shape.position = { left: 0, top: 0, width: 1, height: 1 };
  shape.fill = "none";
  shape.line = { style: "solid", fill: "none", width: 0 };
  shape.shadow = "shadow-none";
  if (clearText && "text" in shape) shape.text = "";
}

export async function addPng(slide, filePath, {
  alt,
  position,
  name,
  fit = "contain",
}) {
  const image = slide.images.add({
    blob: await readBytes(filePath),
    contentType: "image/png",
    alt,
    fit,
    position,
  });
  if (name) image.name = name;
  image.lockAspectRatio = true;
  return image;
}

export function findImportedImage(slide, predicate) {
  const image = slide.images.items.find(predicate);
  if (!image) throw new Error("Imported image matching predicate was not found");
  return image;
}

export function parseTalkTrackSections(raw) {
  const sections = raw
    .split(/\n(?=## \d{2,3}｜)/)
    .filter((section) => /^## \d{2,3}｜/.test(section));

  return sections.map((section) => {
    const numberMatch = section.match(/^## (\d{2,3})｜/);
    const talkMatch = section.match(
      /\[现场讲稿\]\n([\s\S]*?)(?=\n\[转场\]|\n\[结束\])/,
    );
    const endingMatch = section.match(
      /\[(转场|结束)\]\n([\s\S]*?)(?=\n\[Sources\]|$)/,
    );
    if (!numberMatch || !talkMatch || !endingMatch) {
      throw new Error(`Invalid talk-track section:\n${section.slice(0, 160)}`);
    }
    return {
      slideNumber: Number(numberMatch[1]),
      talk: talkMatch[1].trim(),
      endingLabel: endingMatch[1],
      ending: endingMatch[2].trim(),
    };
  });
}

export async function applyTalkTrackOnlyNotes(presentation, scriptPath) {
  const sections = parseTalkTrackSections(await fs.readFile(scriptPath, "utf8"));
  if (sections.length !== presentation.slides.items.length) {
    throw new Error(
      `Expected ${presentation.slides.items.length} note sections, found ${sections.length}`,
    );
  }

  for (const section of sections) {
    const slide = presentation.slides.getItem(section.slideNumber - 1);
    slide.speakerNotes.textFrame.setText(
      [
        "[现场讲稿]",
        section.talk,
        "",
        `[${section.endingLabel}]`,
        section.ending,
      ].join("\n"),
    );
    slide.speakerNotes.setVisible(true);
  }
}

export async function exportQaArtifacts(presentation, workspace) {
  const renderDir = path.join(workspace, "final-render");
  const layoutDir = path.join(workspace, "final-layout");
  await fs.mkdir(renderDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(
      path.join(renderDir, `${stem}.png`),
      new Uint8Array(await png.arrayBuffer()),
    );
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(
      path.join(layoutDir, `${stem}.layout.json`),
      await layout.text(),
    );
  }

  const montage = await presentation.export({
    format: "webp",
    montage: true,
    scale: 1,
  });
  await fs.writeFile(
    path.join(workspace, "final-montage.webp"),
    new Uint8Array(await montage.arrayBuffer()),
  );
}
