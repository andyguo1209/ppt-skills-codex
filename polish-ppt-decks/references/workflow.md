# Template-preserving workflow

## 1. Prepare

- Read the presentations skill completely.
- Set a writable task workspace.
- Copy the source PPTX into that workspace.
- Render and inspect every source slide.
- Create `input-role-map.txt` and classify every supplied file as:
  - content source;
  - template source;
  - style-only reference.
- Default older decks, example decks, screenshots, and inspiration images to style-only reference.
- Record any user-authorized content reuse explicitly. No authorization means no wording, data, cases, diagrams, story, or sequence may be copied from the reference.

## 2. Inspect the template

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

Every output slide must map to a real source slide.

## 3. Prepare the starter

Use `prepare_template_starter_deck.mjs` with the validated frame map. If the deck needs a new closing slide, duplicate an appropriate source cover or closing slide through the map rather than adding a blank slide.

## 4. Plan visuals

Before writing `transform.mjs`, map every slide to a visual treatment and mark which assets must be generated or sourced. Do not stop after a small set of showcase pages. Every visually empty card, statement, comparison, process, ladder, case, closing, or Q&A slide must receive topic-specific illustrations or a documented native visual alternative.

Do not count generic badges, single letters in circles, or decorative glow as illustration coverage. Avoid more than three consecutive content slides without a meaningful visual anchor unless the user explicitly requests a text-first deck.

If the user explicitly requests illustrations on all pages, remove all page-type exceptions. Include cover, metrics, hubs, cycles, relationship diagrams, Q&A, and thank-you pages, then verify every slide contains at least one topic-specific illustration.

## 5. Author

Create a task-specific `transform.mjs`. Use inherited shapes and placeholders first. Add a new primitive only when the map explicitly permits it in a bounded zone.

All audience-facing titles, body copy, labels, cards, tables, charts, processes, connectors, page numbers, and speaker identity must remain native editable slide objects. Never make a rendered source slide, screenshot, contact-sheet crop, or generated full-slide bitmap the content layer of the final slide.

Run:

```bash
node <workspace>/pipeline/run_transform.mjs \
  --starter <workspace>/template-starter.pptx \
  --transform <workspace>/transform.mjs \
  --workspace <workspace> \
  --out <final.pptx>
```

## 6. Image generation

- Use the imagegen skill.
- Generate one coherent object per role, stage, capability, or concept.
- Match the deck's palette and lighting.
- Match the reference's visual scale: a card-level mini-scene reference requires card-level mini-scenes, not one full-slide hero image.
- For related three-to-six-item cards or processes, generate a coherent asset sheet and crop it into separate transparent PNGs.
- Request no text, labels, legends, numbers, logo, or watermark.
- Use generated images only as backgrounds, photos, textures, or standalone illustrations.
- Add every semantic label as a separate editable slide object.
- For a cutout, use chroma-key generation and the imagegen skill's removal helper.
- Copy final project-bound images into `<workspace>/assets`.
- Record prompts and selected output paths in `prompt-record.txt`.
- For cropped asset sheets, run `node <skill>/scripts/validate_illustration_assets.mjs <asset-dir>`. If it reports detached edge fragments, generate a non-destructive cleaned set with `--output-dir <clean-asset-dir>` and reference that set from the transform.

## 7. Notes

Keep the full rehearsal script separate. When the user wants a clean presenter view, inject only `[现场讲稿]` and `[转场]`/`[结束]`.

Run:

```bash
node <workspace>/pipeline/validate_prompter.mjs <final.pptx>
```

## 8. QA

Run:

1. full-slide render;
2. `slides_test.py`;
3. `check_template_fidelity.mjs`;
4. `node <workspace>/pipeline/validate_editability.mjs <final.pptx>`;
5. `node <workspace>/pipeline/validate_visual_details.mjs <workspace>/final-layout`;
6. full-size visual review of every changed slide;

The visual-details gate must fail when a cleanup mask overlaps more than 2% of a semantic illustration. Never approve a same-color rectangle placed over an image edge; repair the bitmap or replace the asset.
7. deck-level montage review;
8. compare the final montage against `visual-plan.md` for coverage and barren sequences.

Fix text wrapping before reducing font size. Treat compact-token wrapping, sub-48 px two-digit badge text boxes, repeated peer groups offset more than 24 px from the slide center, illustrated comparison cards whose illustration occupies less than 10% of the panel area, hub links that are not native one-to-one connectors, and hub nodes entering the 16 px center safe zone as hard failures. Resolve every unexplained fidelity or editability issue before delivery. A slide that looks correct but is flattened into one image does not pass QA.
