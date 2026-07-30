# Content-to-deck planning

Use this workflow when the user supplies PPT/PPTX content, a document, notes, an outline, or mixed source materials and expects a newly structured presentation.

## 1. Build the content inventory

Extract every authorized content unit before deciding page count. A unit may be:

- a claim or conclusion;
- a fact, metric, quote, example, or caveat;
- a table or chart and its meaning;
- a process step or relationship;
- an image with a meaningful caption;
- a speaker-note paragraph that contains material not visible on the source slide.

Give every unit a stable ID and preserve its source locator.

```json
{
  "id": "unit-012",
  "source": "briefing.pptx",
  "sourceSlide": 7,
  "kind": "evidence",
  "text": "Evaluation throughput increased after automation.",
  "required": true
}
```

Do not summarize away numbers, qualifiers, exceptions, or evidence that changes the meaning. Exact duplicates may be consolidated if all original source locators remain recorded.

## 2. Define the communication job

Before outlining, specify:

- intended audience;
- deck job: educate, persuade, recommend, report, facilitate, or enable a decision;
- audience outcome;
- central takeaway;
- expected duration or reasonable default;
- language and tone;
- mandatory topics and prohibited content.

Use the duration to estimate scope, but do not force a fixed page count. A typical spoken slide needs one meaningful beat, not one source page.

## 3. Design the narrative

Choose an arc that fits the job:

- context → stakes → evidence → implications → action;
- question → analysis → answer;
- problem → causes/options → recommendation;
- current state → change → future state;
- chronology, process, learning progression, or claim → evidence → consequence.

An agenda is not the narrative. Each slide should answer a question raised by the prior slide or create the need for the next.

## 4. Draft and confirm the talk manuscript

Write `talk-script.txt` before deciding slide count. It should contain the complete spoken narrative in sections, including the opening question, main claims, evidence, cases, conclusion, and discussion prompt.

Do not add page numbers, layouts, illustration prompts, or slide titles yet. Present the manuscript to the user and wait for explicit approval. Record `talk-script=approved` before continuing.

## 5. Divide approved content into slides

Use one primary claim per slide.

- Split a source slide when it contains multiple claims, audiences, time periods, or visual jobs.
- Merge source slides when they repeat the same claim or evidence.
- Keep a metric with its meaning, not as an isolated number.
- Keep a case in a complete chain: context → action → evidence → result → implication.
- Keep a process at a readable number of stages; move detailed exceptions into notes or a follow-up slide.
- Use section dividers only when they improve orientation.
- Avoid creating pages that merely hold one orphan bullet without a narrative reason.

Do not invent bridge claims. When a transition requires unsupported information, use a neutral transition or ask the user for the missing content.

## 6. Draft and confirm the human-readable page content

Before PowerPoint authoring, produce `page-content.txt`. It is the reviewable content contract and should resemble a well-structured逐页演讲稿:

```text
## 02｜AI first compresses execution cost

[建议时长：55秒]

[本页任务]
Explain that AI changes repeatable execution before it replaces whole roles.

[屏幕内容]
- AI first compresses execution cost
- Repetition and clear acceptance criteria make work easier to automate

[现场讲稿]
AI does not replace a complete role in one step...

[转场]
So which human responsibilities become more valuable?

[视觉建议]
Editable comparison with two no-text technical illustrations.

[来源映射]
unit-001, unit-004
```

This file is not the PPT itself. It separates content decisions from layout decisions and lets the user review the story before slide generation. Use `[结束]` instead of `[转场]` on the last page.

Present the complete page content and title list, then wait for explicit approval. Do not inspect or select the production template until `page-content=approved`.

## 7. Create `slide-blueprint.json`

```json
{
  "version": 1,
  "communicationJob": "By the end, engineering leaders should understand why quality work must become a system.",
  "contentUnits": [
    {
      "id": "unit-001",
      "source": "source.pptx",
      "sourceSlide": 1,
      "kind": "claim",
      "text": "Execution cost is falling.",
      "required": true
    }
  ],
  "slides": [
    {
      "number": 1,
      "kind": "cover",
      "title": "From testing to quality systems",
      "claim": "Introduce the topic and speaker.",
      "durationSeconds": 45,
      "onSlideContent": ["From testing to quality systems", "Speaker name and role"],
      "speakerScript": "Introduce the topic, speaker, and central question.",
      "transition": "Before the answer, start with a judgment.",
      "sourceUnitIds": [],
      "layoutIntent": "minimal title and speaker",
      "visualJob": "native template background"
    },
    {
      "number": 2,
      "kind": "content",
      "title": "AI first compresses execution cost",
      "claim": "The immediate change is cheaper execution, not instant role replacement.",
      "durationSeconds": 55,
      "onSlideContent": [
        "AI first compresses execution cost",
        "Repeatable work with clear acceptance criteria is easier to automate"
      ],
      "speakerScript": "Explain the distinction between a role and the repeatable actions inside it.",
      "transition": "So which human responsibilities become more valuable?",
      "sourceUnitIds": ["unit-001"],
      "layoutIntent": "claim plus evidence",
      "visualJob": "editable comparison with one illustration"
    }
  ]
}
```

Required fields:

- root: `version`, `communicationJob`, `contentUnits`, `slides`;
- content unit: `id`, `source`, `kind`, `text`, `required`;
- slide: `number`, `kind`, `title`, `claim`, `durationSeconds`, `onSlideContent`, `speakerScript`, `transition`, `sourceUnitIds`, `layoutIntent`, `visualJob`.

Cover, divider, Q&A, and thank-you pages may have no source units. Content, evidence, process, comparison, metric, case, and conclusion pages normally require at least one mapped source unit.

## 8. Render and validate the page content

Generate the readable script from the blueprint:

```bash
node <skill>/scripts/render_page_content.mjs \
  <workspace>/slide-blueprint.json \
  <workspace>/page-content.txt
```

After the user or Codex revises either representation, synchronize them and verify:

```bash
node <skill>/scripts/render_page_content.mjs \
  <workspace>/slide-blueprint.json \
  <workspace>/page-content.txt \
  --check
```

Do not author the PPT while these files disagree.

## 9. Validate before and after authoring

Run:

```bash
node <skill>/scripts/validate_content_plan.mjs <workspace>/slide-blueprint.json
```

The validator rejects:

- duplicate or non-sequential slide numbers;
- duplicate content-unit IDs;
- missing required content units;
- unknown source-unit references;
- content slides without source mappings;
- slides without a title, primary claim, duration, visible copy, talk track, transition, layout intent, or visual job;
- content units without source provenance or text.

After the user changes the story, update the blueprint first, re-run validation, and only then regenerate slides.

## 10. Confirm template and style proof

After page-content approval:

1. ask whether the user requires a fixed template;
2. confirm the selected template or custom style direction;
3. render only three representative proof slides;
4. wait for visual approval;
5. validate the approval ledger before generating the full deck.

## 11. Author from the approved page content

- Create editable audience-facing text; do not paste planning fields onto the slide.
- Treat `claim` as the writing target, not necessarily the exact title.
- Use `onSlideContent` as the allowed visible copy. Shorten only when meaning and source mapping remain intact.
- Use `speakerScript` and `transition` to create presenter notes in the requested format.
- Use `layoutIntent` and `visualJob` to choose the layout and assets.
- Put detailed explanation into speaker notes when requested.
- Preserve source traceability in working files and `[Sources]` note blocks when required by the presentations skill.
- Render and inspect every output slide; a valid blueprint does not replace visual QA.
