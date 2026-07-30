# Transform patterns

## Keep semantic content editable

Use native slide text and shapes for all content that the audience must read or interpret. Images should supply only the background, photo, texture, or no-text illustration.

```js
const slide = presentation.slides.getItem(0);
const card = slide.shapes.add({
  geometry: "roundRect",
  position: { left: 76, top: 260, width: 300, height: 210 },
  fill: { color: "#0A3154", transparency: 8 },
  line: { color: "#00D8F5", width: 1.5 },
});
card.name = "editable-card";

const label = slide.addText("平台责任", {
  name: "editable-card-title",
  position: { left: 104, top: 288, width: 240, height: 34 },
  style: { fontSize: 24, bold: true, color: "#F8FAFC" },
});
```

Do not render this card and label into a bitmap. Do not ask image generation to draw the words.

## Edit inherited text

```js
const slide = presentation.slides.getItem(0);
const title = helpers.findShape(slide, "cover-title");
title.text = "New title";
title.position = { left: 76, top: 210, width: 620, height: 80 };
title.text.style = {
  fontSize: 50,
  bold: true,
  color: "#F8FAFC",
  alignment: "left",
};
```

## Replace an inherited image

```js
const inherited = helpers.findImportedImage(
  slide,
  (image) => image.position.left > 500 && image.position.width < 1000,
);
inherited.position = { left: 0, top: 0, width: 1, height: 1 };
await helpers.addPng(slide, `${workspace}/assets/cover-hero.png`, {
  name: "cover-hero",
  alt: "AI quality engineering system",
  position: { left: 650, top: 165, width: 570, height: 450 },
});
```

The replacement image must not contain audience-facing text, labels, legends, numbers, logos, or watermarks. Place those elements as editable PowerPoint objects.

## Apply clean presenter notes

```js
await helpers.applyTalkTrackOnlyNotes(
  presentation,
  `${workspace}/speaker-script.txt`,
);
```

Apply notes after all image/source-note operations so the requested presenter format remains final.

## Hide inherited content

```js
helpers.hideShape(helpers.findShape(slide, "obsolete-keyword-row"), {
  clearText: true,
});
```

Only hide or delete inherited content explicitly listed in the frame map or edit plan.
