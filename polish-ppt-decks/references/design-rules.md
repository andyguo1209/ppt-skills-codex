# Design rules learned from production use

## Editable-first

- Build semantic content with native text boxes, shapes, lines, connectors, tables, and charts.
- Do not use full-slide screenshots, rendered slide images, or generated images containing copy.
- Backgrounds, photographs, textures, and standalone no-text illustrations may be raster.
- Keep titles, captions, data, legends, labels, cards, processes, page numbers, and speaker details editable.
- A reference deck controls visual direction only by default. It does not supply content.

## Cover

- Use one left or centered reading axis.
- Limit the hierarchy to conference label, title, subtitle, and speaker identity.
- Avoid combining a keyword rail, accent line, speaker badge, bilingual label, name, and role in the same region.
- Treat the conventional conference cover as text-first. When the inherited background already carries the visual identity, use no added illustration.
- Do not turn the cover into a concept-explanation slide. Never add a hub, flywheel, process, capability model, relationship network, labeled orbit, card group, or diagram with editable content labels.
- Use a hero visual only when the user or reference clearly calls for one. Keep it thematic, visually subordinate to the title, free of labels, and unrelated to any content-slide diagram grammar.
- Prefer a single-line title when it fits cleanly. If a line break is necessary, balance line lengths deliberately.
- Keep the speaker block simple: name and role on two lines or one concise line. Do not wrap it in a badge, rail, panel, or decorative identity component unless the source template already does so.

## Cards

- For visually led decks, use number → title → unique card-level illustration → one-line meaning.
- Each role, capability, process stage, system, or concept must have a semantically distinct illustration when the reference uses illustrated cards.
- A letter in a circle, number badge, generic line icon, or decorative glow is not a substitute for an illustration.
- Match the reference's scale: compact technical mini-scenes belong inside cards; do not replace them with one oversized cinematic object or a flat character scene.
- Keep card fills dark and text high contrast.
- Avoid large empty rectangles containing only a short label.
- Avoid "large outer card + small centered content stack". In a two-column comparison, let the illustration occupy at least 10% of the card area and use a side-by-side image/text composition when the card is wide.
- Use the full internal width deliberately: illustration on one side, editable title and two levels of meaning on the other. Do not create an unframed narrow column floating inside a wide card.
- Use equal card heights and consistent internal baselines.
- Compute the first card's horizontal position from the slide width and the repeated group's total width. Do not hardcode a left origin for an otherwise centered peer group.
- Keep the union of repeated peer cards centered within 24 px of the slide center unless the composition deliberately reserves an asymmetric text or image region.
- Keep two-digit number badges such as `01–06` on one line. Center the text box over the badge and use at least 48 px of text-box width, even when the visible circle is smaller.
- Highlight one card with gold; use cyan for the remaining structure.

## Processes

- Use four to six short stages.
- Keep connectors behind nodes.
- Make the end state visually distinct.
- Explain what enters the process, what changes, and what becomes reusable.

## Hubs and radial relationships

- Use a true radial structure: one center, one evenly distributed ring of peer nodes, and one native connector from the center edge to each node edge.
- Use circular or compact oval nodes when the relationship is conceptual rather than a detailed card comparison.
- Keep at least a 16 px safe zone around the center engine. No top, bottom, left, or right node may enter it.
- Do not use one full-width horizontal rule and one full-height vertical rule as substitutes for individual relationships.
- Keep connectors behind nodes and labels. Each connector must terminate at the relevant node instead of running through the entire slide.
- Inspect every hub illustration at full size and recrop, clean, or replace isolated tile fragments before delivery.
- Never cover a bitmap edge with a same-color shape to hide crop residue. The cover can amputate the subject after scaling or renderer differences.
- Preserve transparent padding around the complete silhouette and verify the topmost, bottommost, leftmost, and rightmost meaningful pixels remain visible after PowerPoint rendering.
- When a generated asset sheet uses a visible or implied grid, do not crop at the grid boundary. A globe, antenna, arrow, halo, or platform may cross into the neighboring cell. Recover each complete connected subject from the full transparent sheet, normalize it with at least 24 px of transparent padding, and require `recrop-report.json`.
- Reject a tile whose main subject begins or ends in an unexplained long flat edge, even when later normalization added transparent padding around that already-amputated bitmap. Transparent margin is not evidence that the subject itself is complete.

## Cycles and flywheels

- Use a continuous circular or elliptical orbit so the loop is visible immediately.
- Place four to six circular stage nodes on the orbit; each stage keeps its own editable number and short label. Add a stage illustration only when the node remains readable at presentation scale.
- Use an illustrated central engine for the accumulated capability, memory, immunity, or platform core.
- Highlight the decisive transition with gold while the remaining stages use cyan.
- Keep the orbit and all labels as native editable PowerPoint objects.
- Reserve a clear central safe zone: the top and bottom stage nodes must not overlap the center engine or its label.
- Keep neighboring stage circles visually separated. Do not place paragraph-length explanations inside ring nodes; merge stages or move detail into a supporting line when necessary.
- Draw the orbit behind opaque nodes so it never crosses text. Remove floating accent lines that do not communicate direction or state.
- Do not arrange rectangular cards around a center and call it a flywheel.
- Do not connect cycle nodes with unrelated horizontal or vertical lines that fail to show a continuous loop.

## Metrics

- Lead with one hero metric.
- Add two or three supporting figures.
- State the operational meaning, not only the number.
- Keep units next to values and use consistent number formatting.

## Closing

- Keep the discussion slide and thank-you slide separate when both are needed.
- A thank-you slide benefits from large type and generous whitespace.
- Reuse the cover's inherited structure to create a visual bookend.

## Common failure modes

- Too many visual levels in one column.
- A cover that looks like a hub, process, framework, or content page instead of a formal title-and-speaker first screen.
- Generated images that use a different material or lighting style.
- Low-contrast body copy on dark cards.
- Repeated brown/gold fills that overpower the blue template.
- Long bullet lists where one clear sentence would work.
- Technically editable decks that remain visually barren.
- Repeating generic badges while claiming that illustration coverage is complete.
- Generating one hero image when the reference requires one mini-scene per card or stage.
- Notes containing production metadata instead of presenter copy.
- Copying content from a deck that was provided only as visual reference.
- Flattening a polished slide into a single image.
- Baking titles, metrics, labels, legends, or diagrams into generated artwork.
- Two-digit number badges wrapping into a vertical `0` / `2` stack because the text box is narrower than its PowerPoint insets.
- Individual cards looking aligned while the entire repeated group is shifted left or right because its starting x-coordinate was fixed instead of calculated.
- Wide comparison cards with a tiny centered illustration and a narrow vertical text stack, leaving most of both sides visually unused.
- Hub diagrams built from rectangular cards sitting on two axis-spanning lines instead of individually connected radial nodes.
- Center and outer nodes competing for the same space, or generated tile fragments floating outside the intended illustration.
- Grid-sliced illustrations with a missing dome, globe cap, antenna, arrow, platform edge, or other amputated main-subject pixels.
