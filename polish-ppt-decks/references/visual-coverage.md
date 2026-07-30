# Visual coverage

Use this reference before writing the deck-specific transform.

## Build a visual plan first

Create `<task-workspace>/visual-plan.md` with one row per slide:

```text
| Slide | Communication job | Visual treatment | Asset status |
|------:|-------------------|------------------|--------------|
| 02 | Invite a judgment | Four illustrated role cards | generate |
| 15 | Explain a quality pipeline | Five illustrated process stages | generate |
| 19 | Prove scale | Native metric composition | no raster asset |
```

The plan prevents a deck from being technically editable but visually empty.

## Literal full-deck requests

When the user says “all slides”, “every slide”, “所有页面”, or an equivalent phrase:

- every slide must contain at least one meaningful topic-specific illustration;
- cover, metrics, hubs, cycles, relationship diagrams, Q&A, and thank-you slides are included;
- every distinct semantic card or node should receive its own illustration;
- native circles, arrows, connectors, charts, and diagrams remain editable structure, but they do not count as permission to skip illustration;
- validate the final PPTX by counting slide images and visually reviewing every slide, not by checking only a montage sample.

## Coverage targets

For a normal visual conference deck:

- Audit every slide; do not impose a small fixed illustration quota.
- Illustrate every visually empty card, statement, comparison, process, ladder, case, closing, and Q&A page unless a native chart, diagram, product UI, evidence screenshot, or photograph communicates the idea better.
- Avoid more than three consecutive content slides without a meaningful visual anchor.
- Count charts, diagrams, evidence screenshots, product UI, photos, and topic-specific illustrations as visual anchors.
- Do not count a letter in a circle, a generic badge, a thin divider, or decorative particles as a visual anchor.
- More images are not automatically better. Put them where they add recognition, explanation, evidence, emotion, or pacing.
- A few showcase pages do not compensate for empty card pages elsewhere in the deck. Continue the illustration pass until all eligible pages are covered.

## Card-level illustration pattern

When a reference slide uses an illustration inside each card, preserve that scale and grammar:

```text
number
title
unique compact illustration
one-line meaning
```

The illustration should be the card's visual center. It must represent the actual role, stage, capability, system, or business concept. Do not replace a requested mini-scene set with one large cinematic machine, a generic robot, or a flat people illustration.

## Generating coherent sets

For three to six related items, prefer one asset-sheet generation:

- same isometric or three-quarter camera angle;
- same blue/cyan or user-specified palette;
- same material and lighting;
- no words, numbers, labels, logos, or watermarks;
- generous spacing between cells;
- flat chroma-key or transparent background.

Remove the background and crop each cell into a separate PNG. Insert those PNGs individually so every title, label, description, connector, and highlight remains editable.

## Review gate

Render the complete deck and review both:

1. a full-deck montage for visual rhythm and barren sequences;
2. each illustrated slide at full size for scale, crop, repetition, overlap, and readability.

If a deck still feels like repeated empty cards, return to the visual plan and add or improve meaningful illustrations instead of adding more decorative shapes.
