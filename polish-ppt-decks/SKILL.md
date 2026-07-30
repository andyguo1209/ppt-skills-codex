---
name: polish-ppt-decks
description: Build, restructure, refine, beautify, or finish editable PowerPoint decks from user-uploaded PPT/PPTX content, documents, notes, or templates through staged user approvals. Use when Codex must draft and confirm a talk manuscript, divide approved content into a page-by-page script, confirm the pagination and template or style choice, generate a representative style proof, create the final presentation, preserve a user-provided template, add illustrations and presenter notes, or run content and visual QA. Treat reference decks and screenshots as style-only by default; never import their wording, data, examples, story, or slide sequence unless the user explicitly authorizes content reuse.
---

# Build and Polish PPT Decks

Turn user-supplied content into an editable, coherent presentation, or refine an existing PPTX through a repeatable template-aware pipeline.

## Required skills

1. Use the `presentations` skill for every PPTX operation and read its complete `SKILL.md`.
2. Use the `imagegen` skill when a slide needs a new raster hero, illustration, texture, or cutout.
3. Do not use this skill to create a native Google Slides file; follow the routing in the presentations skill.

## Choose the operating mode

Choose exactly one primary mode before authoring:

- **Build from content**: the user uploads a content-heavy PPT/PPTX, document, outline, notes, or mixed materials and wants a new deck. Extract the authorized content, design the narrative, divide it into slides, then generate the PPTX.
- **Restructure an existing deck**: the user wants the current content retained but permits slide splitting, merging, reordering, and rewriting.
- **Polish in place**: the slide sequence and content are already approved; improve design, visuals, notes, and consistency without changing the narrative.

The same PPTX may be both a content source and a template source when the user wants to keep its branding. Record both roles explicitly rather than treating the rendered pages as finished slide content.

## Mandatory approval gates

For build-from-content and restructure mode, use one stage per user turn. Present the current artifact, ask for confirmation, and stop. Do not begin the next stage in the same turn.

1. **Scope brief**: show the authorized sources, audience, objective, duration, language, must-keep content, and exclusions. Wait for confirmation.
2. **Talk manuscript**: draft `talk-script.txt` as a coherent presentation narrative without page numbers or layout decisions. Wait for content confirmation.
3. **Page content**: only after the talk manuscript is approved, create `page-content.txt` and `slide-blueprint.json`. Show the proposed page count, titles, visible copy, talk track, transitions, and source mapping. Wait for pagination confirmation.
4. **Template or style**: only after page content is approved, ask whether to use a fixed template. If yes, wait for the user to identify or upload it and confirm the rendered template. If no, present a concise style direction and wait for confirmation.
5. **Style proof**: create only a small representative proof—normally the cover, one standard content slide, and one complex slide. Wait for visual confirmation.
6. **Full deck**: generate the complete PPTX only after all prior gates are approved.

Do not treat silence, tool completion, or a previously approved different artifact as approval. Replies such as “确认”, “没问题”, “继续”, or “按这个来” approve only the most recently presented gate. New feedback reopens that gate. Skip gates only when the user explicitly requests a one-shot workflow without confirmations.

Record gate state in `approval-ledger.txt` and run `scripts/validate_approval_ledger.mjs` before entering a gated stage. Read [approval-gates.md](references/approval-gates.md) for the exact protocol.

## Mandatory visual contract

- Editable-first is only the first gate; a deck is not complete merely because its text and shapes are editable.
- If the source or style reference is visually led, match its visual quality with the most suitable medium: editable structure, diagram, evidence, chart, product UI, photography, or illustration. Do not copy its image count mechanically.
- Every added illustration must have a declared communication job: explain a relationship or mechanism, distinguish concepts faster than text alone, provide evidence, create an intentional hero focus, or add necessary emotional/brand context. If it does none of these, omit it.
- When a supplied reference uses compact illustrations inside cards, reuse that grammar only where each image improves recognition and the card has a protected image zone. Never squeeze an image into the readable text area to satisfy a visual quota.
- For role, capability, system, process, and concept cards, `number → editable title → illustration → editable one-line meaning` is an available pattern, not a mandatory formula. Prefer a strong text-and-structure card when the illustration would be redundant or cramped.
- Do not deliver the first editable layout pass as the final result. Complete the visual plan, generate or source the required assets, insert them, render the full deck, and inspect the result at slide and montage scale.
- If the user says “all slides”, “every slide”, “所有页面”, or equivalent, audit every slide literally, but do not force a raster illustration onto every slide. Each page must receive an intentional visual treatment; native diagrams, typography, whitespace, charts, evidence, or a text-first composition may be the correct answer.

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

## Content-to-deck planning

For **Build from content** and **Restructure an existing deck**, do not start with slide drawing.

1. Extract all authorized text, speaker notes, tables, chart labels, image captions, and source-slide references into `content-inventory.json`.
2. Write and confirm `communication-brief.txt`.
3. Draft and confirm `talk-script.txt` before deciding page count.
4. Remove exact duplication, but do not silently discard required facts, examples, evidence, caveats, or conclusions.
5. After talk-script approval, draft `page-content.txt`, a human-readable page-by-page content script similar to the user's supplied逐页演讲稿.
6. Encode the same page content in `slide-blueprint.json`. Split dense source pages and merge only repeated narrative beats.
7. Run the content validators, present the proposed pagination, and wait for user confirmation.
8. Ask for and confirm the template or style, then create and confirm a three-slide style proof.
9. Generate the full editable deck only after `approval-ledger.txt` passes all required gates.

Read [content-to-deck.md](references/content-to-deck.md) whenever content must be divided, reordered, condensed, expanded, or converted into a new presentation.

## Core workflow

1. Classify every input as content source, template source, or style-only reference, then choose the operating mode.
2. Inspect every authorized content source and create the scope brief. Present it and stop for approval.
3. Draft the complete talk manuscript. Present it and stop for approval.
4. Create and validate `content-inventory.json`, `page-content.txt`, and `slide-blueprint.json`. Present the pagination and stop for approval.
5. Ask for a fixed template or style direction. Inspect the selected template or describe the selected direction, then stop for approval.
6. Create three representative style-proof slides, render them, and stop for approval.
7. Before full authoring, run `scripts/validate_approval_ledger.mjs <approval-ledger.txt> --require scope-brief,talk-script,page-content,template-style,style-proof`.
8. Define the communication job and required slide families, then write `<task-workspace>/visual-plan.md`.
9. Build the template frame map and starter deck.
10. Initialize the task workspace and configure the presentations runtime:

   ```bash
   node scripts/init_deck_workspace.mjs \
     --workspace <task-workspace> \
     --source <source.pptx>

   node <presentations-skill>/container_tools/setup_artifact_tool_workspace.mjs \
     --workspace <task-workspace>
   ```

11. Write a deck-specific `transform.mjs` in the task workspace. Export one default async function:

   ```js
   export default async function transform({ presentation, workspace, helpers }) {
     const slide = presentation.slides.getItem(0);
     const title = helpers.findShape(slide, "cover-title");
     title.text = "A clearer title";
   }
   ```

12. Run the transform engine:

   ```bash
   node <task-workspace>/pipeline/run_transform.mjs \
     --starter <template-starter.pptx> \
     --transform <task-workspace>/transform.mjs \
     --workspace <task-workspace> \
     --out <final.pptx>
   ```

13. Render and inspect every final slide; run all content, overflow, fidelity, visual, and editability checks.
14. Iterate until all content mapping, narrative, hierarchy, wrapping, crop, contrast, connector, footer, logo, placeholder, notes, visual-coverage, and editability issues are resolved.

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
- All mandatory approval gates are recorded as approved; no approval belongs to an older superseded artifact.
- In build or restructure mode, `slide-blueprint.json` passes `scripts/validate_content_plan.mjs`, and every required source unit appears on at least one output slide.
- `page-content.txt` exists before slide authoring and passes `scripts/render_page_content.mjs <slide-blueprint.json> <page-content.txt> --check`.
- The page script includes visible copy, talk track, transition, visual brief, and provenance for every planned slide; the PPT and presenter notes follow it.
- The final slide order follows the validated narrative arc; source-page order is not preserved merely for convenience.
- Every content slide has one explicit primary claim and advances the story.
- `<task-workspace>/visual-plan.md` exists and the delivered deck follows it, or deviations are recorded.
- Every card, statement, comparison, process, ladder, case, closing, and Q&A slide has an intentional visual treatment; illustrations are used only where their declared communication job is stronger than text or native structure alone.
- Fixed illustration quotas are forbidden as a completion criterion. Coverage follows communication need, not image count.
- When full-slide coverage was requested, every slide is individually audited and improved, but no slide or semantic card is required to contain an image.
- No sequence of more than five content slides is visually barren unless explicitly justified in the visual plan.
- Used card and process illustrations are unique to their semantic item, visually consistent as a set, and placed inside a dedicated safe zone that does not compete with editable text.
- `<task-workspace>/pipeline/validate_visual_details.mjs <task-workspace>/final-layout` passes; two-digit badges and other compact numeric tokens remain on one line and use text boxes at least 48 px wide, repeated peer-card groups stay within 24 px of the slide center unless an asymmetric composition is explicitly documented, each illustrated comparison card gives its illustration at least 10% of the panel area, no cleanup mask covers more than 2% of an illustration, no later-added semantic illustration covers the readable glyph area of a short label or metric, and every hub uses one connector per node with a 16 px center safe zone.
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
