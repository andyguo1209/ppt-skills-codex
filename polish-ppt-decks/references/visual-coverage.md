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

- audit and improve every slide, including cover, metrics, hubs, cycles, relationship diagrams, Q&A, and thank-you slides;
- choose the visual treatment page by page: illustration, chart, evidence, native diagram, typography, whitespace, or text-first composition;
- do not translate “all slides” into “an image on every slide”;
- validate the final PPTX by reviewing every slide at full size, not by counting images or checking only a montage sample.

If the user later explicitly asks for a conventional text-only cover, honor that request, remove the cover illustration, and record the cover as an intentional native-background visual alternative in `visual-plan.md`. Do not compensate by adding a content diagram to the cover.

## Coverage targets

For a normal visual conference deck:

- Audit every slide; do not impose a small fixed illustration quota.
- Improve every visually weak card, statement, comparison, process, ladder, case, closing, and Q&A page; illustrate only when an image communicates the idea better than native structure or text.
- Avoid more than three consecutive content slides without a meaningful visual anchor.
- Count charts, diagrams, evidence screenshots, product UI, photos, and topic-specific illustrations as visual anchors.
- Do not count a letter in a circle, a generic badge, a thin divider, or decorative particles as a visual anchor.
- More images are not automatically better. Put them where they add recognition, explanation, evidence, emotion, or pacing.
- A few showcase pages do not compensate for weak pages elsewhere in the deck. Continue the design pass until every page is intentional, but remove redundant or cramped images.

## Card-level illustration pattern

When a reference slide uses an illustration inside each card, use that scale and grammar only for cards where the illustration earns its space:

```text
number
title
unique compact illustration
one-line meaning
```

The illustration should be the card's visual center. It must represent the actual role, stage, capability, system, or business concept and remain inside a dedicated image zone. If the text already communicates the distinction and the card cannot protect that zone, omit the illustration. Do not replace a requested mini-scene set with one large cinematic machine, a generic robot, or a flat people illustration.

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
