# Staged approval protocol

Use this protocol for build-from-content and restructure mode. The purpose is to prevent expensive visual production before the user approves the content and structure.

## General rule

Work on one stage only, present its artifact, ask one clear confirmation question, and stop. Do not continue in the same turn after asking for approval.

An approval applies only to the exact artifact most recently shown. If the artifact changes materially, reset that gate and every downstream gate to `pending`.

Accepted approval language includes “确认”, “没问题”, “继续”, “按这个来”, or an equally clear response. Questions, partial feedback, or silence are not approval.

## Gate 1: scope brief

Deliver:

- authorized content, template, and style-only sources;
- audience and presentation objective;
- duration, language, and tone;
- must-keep facts, cases, and constraints;
- exclusions and unresolved assumptions.

Ask: “以上内容范围和分享目标是否确认？确认后我再写完整演讲稿。”

After approval, set `scope-brief=approved`.

## Gate 2: talk manuscript

Deliver `talk-script.txt`:

- a coherent beginning, development, evidence, cases, conclusion, and discussion;
- no slide numbers, page count, layout, or illustration decisions;
- enough prose to judge content completeness and speaking logic.

Ask: “演讲稿内容和叙事是否确认？确认后我再拆分成逐页内容。”

After approval, set `talk-script=approved`.

If the user edits the manuscript, set `talk-script`, `page-content`, `template-style`, and `style-proof` to `pending`.

## Gate 3: page content

Deliver `page-content.txt` and a concise page-title list. Each page includes:

- number, title, and suggested duration;
- page job and visible copy;
- talk track and transition;
- visual suggestion and source mapping.

Ask: “页数、顺序和每页内容是否确认？确认后我再询问并确定模板。”

After approval, set `page-content=approved`.

If pagination or page wording changes materially, reset `page-content`, `template-style`, and `style-proof`.

## Gate 4: template or style

Ask whether the user needs a fixed template only after page content approval.

If yes:

- wait for a template upload or explicit selection;
- render and inspect it;
- summarize the master, colors, fonts, logo, footer, and reusable slide families;
- ask the user to confirm that exact template.

If no:

- present one concise visual direction appropriate to the content, or two to three choices when the decision materially changes the result;
- state palette, typography, illustration direction, and density;
- ask for confirmation.

After approval, set `template-style=approved`.

## Gate 5: style proof

Generate only:

- cover;
- one standard content slide;
- one complex representative slide such as process, comparison, data, or case.

Render them and ask: “这三页的字体、配色、插图和信息密度是否确认？确认后我再生成整套 PPT。”

After approval, set `style-proof=approved`.

Any material visual change resets `style-proof` to `pending`.

## Gate 6: full deck

Before authoring the full deck, run:

```bash
node <skill>/scripts/validate_approval_ledger.mjs \
  <workspace>/approval-ledger.txt \
  --require scope-brief,talk-script,page-content,template-style,style-proof
```

Only a passing result permits complete PPT generation.

## Explicit one-shot override

Skip the staged pauses only when the user explicitly says they do not want intermediate confirmations or wants a one-shot result. Record `one-shot-override=approved` and the user's instruction in the ledger. Never infer this override from urgency or a short deadline.
