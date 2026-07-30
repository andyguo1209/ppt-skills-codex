---
name: polish-ppt-decks
description: Refine, beautify, restructure, or finish existing PowerPoint decks while preserving a user-provided template and producing native editable slide content. Use for PPT/PPTX requests involving visual cleanup, card/process/metric redesign, AI-generated illustrations, cover and closing slides, presenter notes, template fidelity, slide rendering, overflow checks, editability checks, and repeatable code-driven presentation workflows. Treat reference decks and screenshots as style-only by default; never import their wording, data, examples, story, or slide sequence unless the user explicitly authorizes content reuse.
---

# Polish PPT Decks

Turn an existing PPTX into an editable, visually coherent deck through a repeatable template-preserving pipeline.

## Required skills

1. Use the `presentations` skill for every PPTX operation and read its complete `SKILL.md`.
2. Use the `imagegen` skill when a slide needs a new raster hero, illustration, texture, or cutout.
3. Do not use this skill to create a native Google Slides file; follow the routing in the presentations skill.

## Mandatory visual contract

- Editable-first is only the first gate; a deck is not complete merely because its text and shapes are editable.
- If the source or style reference is visually led, the output must contain meaningful topic-specific illustrations, diagrams, evidence, charts, product UI, or photography at a comparable cadence.
- When a supplied reference uses compact illustrations inside cards, reproduce that visual grammar with one unique no-text mini-scene per semantic card. Do not substitute empty cards, letter badges, generic icons, one oversized hero image, or unrelated people/robot artwork.
- For role, capability, system, process, and concept cards, use `number → editable title → unique illustration → editable one-line meaning` unless the reference clearly uses another structure.
- Do not deliver the first editable layout pass as the final result. Complete the visual plan, generate or source the required assets, insert them, render the full deck, and inspect the result at slide and montage scale.
- If the user says “all slides”, “every slide”, “所有页面”, or equivalent, treat it literally: every slide, including cover, metrics, hubs, cycles, relationship diagrams, Q&A, and thank-you slides, must contain at least one meaningful topic-specific illustration. Native circles, connectors, charts, or diagrams do not create an exception. An explicit later request for a conventional text-only cover overrides this rule; document the exception in `visual-plan.md`.

## Non-negotiable input and editability rules

Before touching the deck, classify every supplied file in `input-role-map.txt`:

- **Content source**: text, data, cases, claims, and structure that the user authorizes for the new deck.
- **Template source**: master, layouts, logo, footer, page markers, palette, and typography to preserve.
- **Style-only reference**: visual hierarchy, composition, spacing, material, lighting, card style, and illustration direction only.

Default every older PPT, screenshot, example page, and inspiration deck to **style-only reference** unless the user explicitly says its content may be reused.

- Never copy a style-only reference's wording, data, examples, diagrams, story, or slide sequence.
- Never replace the current deck's content with reference-deck content unless the user explicitly requests that change.
- Never use a rendered slide, screenshot, contact-sheet crop, or generated full-slide image as the final audience-facing slide.
- Keep titles, body copy, labels, cards, tables, charts, processes, connectors, page numbers, and speaker identity as native editable PowerPoint objects.
- Raster images are allowed only for backgrounds, photos, textures, standalone illustrations, and user-authorized evidence screenshots.
- Generated images must contain no copy, labels, legends, numbers, logos, or watermarks. Add all semantic text as editable slide objects.
- If content provenance is ambiguous, preserve the current source deck's content and use the reference only for visual direction.

## Core workflow

1. Classify every input as content source, template source, or style-only reference.
2. Inspect the complete source deck and render every source slide.
3. Define the communication job and identify the weakest slide families: cover, comparisons, processes, metrics, cases, closing, or notes.
4. Before authoring slides, write `<task-workspace>/visual-plan.md`. Map every slide to its visual job, selected treatment, and asset status. Illustration coverage is determined by eligible page type, not by a fixed quota: every visually empty card, statement, comparison, process, ladder, case, closing, or Q&A page must receive topic-specific illustrations or a documented native visual alternative.
5. Build a template frame map and starter deck using the presentations skill's template-following scripts.
6. Initialize a task workspace and configure the presentations runtime:

   ```bash
   node scripts/init_deck_workspace.mjs \
     --workspace <task-workspace> \
     --source <source.pptx>

   node <presentations-skill>/container_tools/setup_artifact_tool_workspace.mjs \
     --workspace <task-workspace>
   ```

7. Write a deck-specific `transform.mjs` in the task workspace. Export one default async function:

   ```js
   export default async function transform({ presentation, workspace, helpers }) {
     const slide = presentation.slides.getItem(0);
     const title = helpers.findShape(slide, "cover-title");
     title.text = "A clearer title";
   }
   ```

8. Run the transform engine:

   ```bash
   node <task-workspace>/pipeline/run_transform.mjs \
     --starter <template-starter.pptx> \
     --transform <task-workspace>/transform.mjs \
     --workspace <task-workspace> \
     --out <final.pptx>
   ```

9. Render the final PPTX with LibreOffice, inspect every affected slide at full size, run overflow, template fidelity, visual-coverage, and editability checks.
10. Run `<task-workspace>/pipeline/validate_visual_details.mjs <task-workspace>/final-layout` to reject wrapped two-digit badges, undersized compact-token text boxes, repeated peer-card groups that are visibly off-center, illustrated comparison cards whose visual content is too sparse, and malformed hub diagrams.
11. For asset sheets, never slice fixed grid cells directly. Run `scripts/recrop_illustration_sheets.mjs` so complete connected subjects are recovered across nominal cell boundaries, then run `scripts/validate_illustration_assets.mjs <tile-dir> --require-recrop-report`. Reject detached fragments, suspicious flat clipping edges, missing crop provenance, or incomplete silhouettes. If only detached fragments need cleanup, write a new asset directory with `--output-dir`; missing subject pixels require recropping or regeneration.
12. Iterate until all hierarchy, wrapping, crop, contrast, connector, footer, logo, placeholder, notes, visual-coverage, and editability issues are resolved.

Read [workflow.md](references/workflow.md) for the full command sequence.
Read [visual-coverage.md](references/visual-coverage.md) before generating or selecting visual assets.

## Design rules

- Preserve the user's template, master/layout hierarchy, logo, footer, page markers, palette, and typography unless explicitly asked otherwise.
- Diagnose before decorating. State the concrete issue: unclear hierarchy, excessive layers, weak contrast, sparse composition, generic cards, inconsistent imagery, or unreadable copy.
- Prefer subtraction. A conventional cover normally needs only a conference label, one title hierarchy, one subtitle, and one speaker identity. If the inherited template background is already visually strong or the user asks for a normal title page, omit the hero visual.
- Never place a hub, flywheel, process, capability model, relationship network, card group, or explanatory diagram on the cover. Those are content-slide structures.
- If a cover uses a hero visual, keep it subordinate and thematic; it must not introduce editable labels, nodes, relationships, stages, or claims that compete with the title.
- Use a single reading axis. Do not stack unrelated labels, rules, badges, keywords, and speaker decorations in the same column.
- Use gold only for emphasis and cyan for structure. Never highlight every object.
- Keep each card to icon → title → one-line meaning. Replace low-contrast bullet stacks with concise claims.
- On wide two-column comparisons, avoid a narrow centered content stack inside a large panel. Use a side-by-side illustration/text composition and give the illustration enough scale to anchor the card.
- A letter in a circle, number badge, generic line icon, or decorative glow is not an illustration.
- When cards represent distinct roles, stages, capabilities, systems, or business concepts, use `number → title → unique illustration → one-line meaning` unless the user's reference clearly calls for another structure.
- Match the user's reference at the correct visual scale. If the reference uses compact card-level technical scenes, do not substitute a single cinematic hero render or a flat character scene.
- Do not allow more than three consecutive content slides without a meaningful visual anchor unless the narrative is intentionally text-first.
- Generate coherent asset sets rather than isolated images: one unique mini-scene per card or process stage, consistent camera angle, lighting, palette, material, and transparent background.
- Asset sheets are allowed as a generation technique, but crop each cell into a separate transparent PNG before inserting it into PowerPoint.
- Treat grid lines as indexing hints, not hard crop boundaries. Generated subjects may cross those lines; segment the full transparent sheet by connected main subjects and preserve every meaningful top, bottom, left, and right pixel.
- Never hide crop artifacts by placing same-color rectangles, masks, panels, or other shapes over an illustration. Clean or replace the source bitmap and preserve the complete visual silhouette.
- Give process slides short stages, consistent connectors, and one emphasized terminal state.
- For flywheels and closed loops, use a real circular or elliptical orbit with illustrated circular stage nodes and an illustrated center engine. Keep neighboring nodes separated, reserve a clear center safe zone, and place the orbit behind the nodes. Do not simulate a cycle with rectangular cards connected by unrelated straight lines.
- For hubs and radial relationships, use evenly distributed peer nodes with one native center-to-node connector each. Keep at least 16 px around the center engine and reject axis-spanning crosshair lines.
- Make metrics tell one story: hero result, supporting evidence, and implication.
- Preserve editability for all semantic content and structures. Use raster images only for backgrounds, photos, textures, or standalone illustrations.
- Treat reference decks as visual references only unless the user explicitly authorizes content reuse.
- Reject flattened slides and images containing audience-facing text.
- Do not reuse the same generated illustration on multiple content slides.

Read [design-rules.md](references/design-rules.md) when redesigning a cover, cards, processes, metrics, or closing slides.

## Presenter notes

- If the user requests a teleprompter, default to only:

  ```text
  [现场讲稿]
  ...

  [转场]
  ...
  ```

- Use `[结束]` instead of `[转场]` on the last slide.
- Keep timings, purpose notes, implementation comments, and provenance out of presenter view when the user asks for talk-track-only notes.
- Keep detailed rehearsal scripts and provenance in separate task-workspace text files.
- Use `helpers.applyTalkTrackOnlyNotes(...)` for deterministic note injection.
- Validate notes with `<task-workspace>/pipeline/validate_prompter.mjs`.

## Code organization

- Keep one reusable engine and one deck-specific transform.
- Put generated images in `<task-workspace>/assets`.
- Put renders, layouts, montages, prompt records, source notes, and deviation logs inside the task workspace.
- Keep only final deliverables outside the task workspace.
- Never hardcode a user's home path into reusable skill scripts.

Read [transform-patterns.md](references/transform-patterns.md) for reusable authoring patterns.

## QA gates

Do not deliver until:

- Every slide renders.
- `<task-workspace>/visual-plan.md` exists and the delivered deck follows it, or deviations are recorded.
- Every eligible card, statement, comparison, process, ladder, case, closing, and Q&A slide contains meaningful topic-specific illustrations or a documented native visual alternative.
- Fixed illustration quotas are not a completion criterion. Coverage must follow the slide audit and continue until no visually empty eligible page remains.
- When full-slide coverage was requested, every slide has at least one topic-specific illustration and every semantic card or node that reads as a distinct concept has its own illustration, except a later user-authorized text-only cover recorded in `visual-plan.md`.
- No sequence of more than five content slides is visually barren unless explicitly justified in the visual plan.
- Card and process illustrations are unique to their semantic item and visually consistent as a set.
- `<task-workspace>/pipeline/validate_visual_details.mjs <task-workspace>/final-layout` passes; two-digit badges and other compact numeric tokens remain on one line and use text boxes at least 48 px wide, repeated peer-card groups stay within 24 px of the slide center unless an asymmetric composition is explicitly documented, each illustrated comparison card gives its illustration at least 10% of the panel area, no cleanup mask covers more than 2% of an illustration, and every hub uses one connector per node with a 16 px center safe zone.
- No text or object overflows the canvas.
- Affected slides have been inspected at full size.
- The title hierarchy is readable in under two seconds.
- The cover reads as a formal first screen: conference label, title, subtitle, speaker name, and role form one left or centered axis; no content diagram competes with them.
- Images have clean crops and sufficient resolution.
- Sheet-cropped PNGs pass `scripts/validate_illustration_assets.mjs <tile-dir> --require-recrop-report`; no detached fragment, suspicious flat subject edge, missing crop provenance, or amputated silhouette remains.
- Speaker notes match the requested format.
- Template fidelity passes with zero unexplained issues.
- `<task-workspace>/pipeline/validate_editability.mjs <final.pptx>` passes.
- All audience-facing copy and structures remain editable.
- No slide is a flattened screenshot or full-slide generated image.
