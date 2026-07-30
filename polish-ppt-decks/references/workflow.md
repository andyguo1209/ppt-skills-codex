# Content-to-deck and template-preserving workflow

## 1. Prepare

- Read the presentations skill completely.
- Set a writable task workspace.
- Choose build-from-content, restructure, or polish-in-place mode.
- Copy authorized content and template sources into that workspace.
- Render and inspect every supplied PPTX; extract editable text, notes, tables, chart labels, and source locators from every content source.
- Create `input-role-map.txt` and classify every supplied file as:
  - content source;
  - template source;
  - style-only reference.
- A PPTX may be both a content source and template source when its branding should be retained.
- Default older decks, example decks, screenshots, and inspiration images to style-only reference.
- Record any user-authorized content reuse explicitly. No authorization means no wording, data, cases, diagrams, story, or sequence may be copied from the reference.

## 2. Plan the content

For build-from-content and restructure mode:

- create `content-inventory.json` with stable IDs and source locators for all authorized claims, evidence, cases, caveats, notes, tables, and chart meanings;
- create `communication-brief.txt`;
- create the human-readable `page-content.txt`, modeled on a逐页演讲稿 rather than a loose outline;
- create `slide-blueprint.json` following `references/content-to-deck.md`;
- split source pages that contain multiple narrative jobs;
- merge only genuinely redundant beats;
- run `node <skill>/scripts/validate_content_plan.mjs <workspace>/slide-blueprint.json`;
- run `node <skill>/scripts/render_page_content.mjs <workspace>/slide-blueprint.json <workspace>/page-content.txt --check`;
- resolve every unmapped required unit and invalid source reference before authoring.

For polish-in-place mode, retain the approved page order and use a lighter slide audit instead of re-outlining.

## 3. Inspect the template

Use the presentations skill's `inspect_template_deck.mjs` and review:

- source slide PNGs;
- layout JSON;
- `template-inspect.ndjson`;
- masters, layouts, placeholders, logos, footers, and fonts.

Create:

- `template-audit.txt`;
- `template-frame-map.json`;
- `deviation-log.txt`.
- `visual-plan.md`, following `references/visual-coverage.md`.

Every output slide must map to an approved source frame or layout. Multiple output slides may duplicate the same validated frame when content planning requires a split; source slide count does not control output slide count.

## 4. Prepare the starter

Use `prepare_template_starter_deck.mjs` with the validated frame map. Duplicate appropriate source frames for newly planned pages rather than adding unstyled blank slides. If no template is supplied, follow the presentations skill's custom-direction or Codex Grid route.

## 5. Plan visuals

Before writing `transform.mjs`, map every planned output slide from `slide-blueprint.json` to a visual treatment and mark which assets must be generated or sourced. Do not stop after a small set of showcase pages. Every visually empty card, statement, comparison, process, ladder, case, closing, or Q&A slide must receive topic-specific illustrations or a documented native visual alternative.

Do not count generic badges, single letters in circles, or decorative glow as illustration coverage. Avoid more than three consecutive content slides without a meaningful visual anchor unless the user explicitly requests a text-first deck.

If the user explicitly requests illustrations on all pages, remove all page-type exceptions. Include cover, metrics, hubs, cycles, relationship diagrams, Q&A, and thank-you pages, then verify every slide contains at least one topic-specific illustration.

If the user later requests a normal text-only title page, treat that as an explicit override: remove the cover illustration, retain only the conference label, title, subtitle, speaker name, and role on one reading axis, and record the exception in `visual-plan.md`. Never replace the removed hero with a hub, relationship diagram, process, or capability model.

## 6. Author

Create a task-specific `transform.mjs`. Use inherited shapes and placeholders first. Add a new primitive only when the map explicitly permits it in a bounded zone.

All audience-facing titles, body copy, labels, cards, tables, charts, processes, connectors, page numbers, and speaker identity must remain native editable slide objects. Never make a rendered source slide, screenshot, contact-sheet crop, or generated full-slide bitmap the content layer of the final slide.

In build-from-content and restructure mode, author from the validated blueprint:

- write visible copy for the audience, not the planning file;
- keep one primary claim per slide;
- preserve mapped evidence, qualifiers, and conclusions;
- use the page script's现场讲稿 and转场 as the presenter-note source;
- use the selected frame as a visual container, not as permission to restore the source page's old wording or structure;
- update both `page-content.txt` and `slide-blueprint.json` whenever slide order, wording, or content mapping changes.

Run:

```bash
node <workspace>/pipeline/run_transform.mjs \
  --starter <workspace>/template-starter.pptx \
  --transform <workspace>/transform.mjs \
  --workspace <workspace> \
  --out <final.pptx>
```

## 7. Image generation

- Use the imagegen skill.
- Generate one coherent object per role, stage, capability, or concept.
- Match the deck's palette and lighting.
- Match the reference's visual scale: a card-level mini-scene reference requires card-level mini-scenes, not one full-slide hero image.
- For related three-to-six-item cards or processes, generate a coherent asset sheet and segment it into separate transparent PNGs. Never use fixed grid cells as final crop boundaries because a generated subject may extend across them.
- Request no text, labels, legends, numbers, logo, or watermark.
- Use generated images only as backgrounds, photos, textures, or standalone illustrations.
- Add every semantic label as a separate editable slide object.
- For a cutout, use chroma-key generation and the imagegen skill's removal helper.
- Copy final project-bound images into `<workspace>/assets`.
- Record prompts and selected output paths in `prompt-record.txt`.
- For cropped asset sheets, run:

  ```bash
  node <skill>/scripts/recrop_illustration_sheets.mjs \
    <sheet-dir> <tile-dir> \
    --sheet-rows "a:4,b:4,c:5" \
    --columns 6 \
    --sheet-prefix coverage-sheet-

  node <skill>/scripts/validate_illustration_assets.mjs \
    <tile-dir> \
    --require-recrop-report
  ```

  The recropper identifies one main connected subject per nominal cell, assigns nearby detached details to the nearest subject, and writes `recrop-report.json`. If validation reports only detached edge fragments, create a non-destructive cleaned set with `--output-dir`. If the main subject is cut flat or missing pixels, recrop from the full sheet or regenerate it; cleanup masks cannot restore missing content.

## 8. Notes

Keep the full rehearsal script separate. When the user wants a clean presenter view, inject only `[现场讲稿]` and `[转场]`/`[结束]`.

Run:

```bash
node <workspace>/pipeline/validate_prompter.mjs <final.pptx>
```

## 9. QA

Run:

1. `node <workspace>/pipeline/validate_content_plan.mjs <workspace>/slide-blueprint.json` for build and restructure mode;
2. `node <workspace>/pipeline/render_page_content.mjs <workspace>/slide-blueprint.json <workspace>/page-content.txt --check`;
3. full-slide render;
4. `slides_test.py`;
5. `check_template_fidelity.mjs`;
6. `node <workspace>/pipeline/validate_editability.mjs <final.pptx>`;
7. `node <workspace>/pipeline/validate_visual_details.mjs <workspace>/final-layout`;
8. full-size visual review of every changed slide;

The visual-details gate must fail when a cleanup mask overlaps more than 2% of a semantic illustration. Never approve a same-color rectangle placed over an image edge; repair the bitmap or replace the asset. Sheet-derived tiles must also carry a passing connected-component recrop report so fixed-cell slicing cannot silently amputate a subject.
9. deck-level montage review;
10. compare the final montage against `visual-plan.md` for coverage and barren sequences;
11. compare the final slide sequence and presenter notes against `page-content.txt` and `slide-blueprint.json`.

Fix text wrapping before reducing font size. Treat compact-token wrapping, sub-48 px two-digit badge text boxes, repeated peer groups offset more than 24 px from the slide center, illustrated comparison cards whose illustration occupies less than 10% of the panel area, hub links that are not native one-to-one connectors, and hub nodes entering the 16 px center safe zone as hard failures. Resolve every unexplained fidelity or editability issue before delivery. A slide that looks correct but is flattened into one image does not pass QA.
