# polish-ppt-decks

一套面向 Codex 的可编辑 PowerPoint 生成与视觉精修 Skill。

它不只是美化工具。用户可以上传内容型 PPT、讲稿、提纲或混合资料，Skill 会分阶段生成分享目标、完整演讲稿、逐页内容稿、模板方案和三页视觉样稿；每个重要节点都必须由用户确认，最终才生成完整可编辑 PPT。

> **重要默认规则：参考 PPT 和截图只用于学习风格，不用于提取内容。**
> 未经用户明确授权，不复制参考稿的文字、数据、案例、图表、故事线或页面顺序。最终标题、正文、卡片、流程、图表和页码必须是 PowerPoint 原生可编辑对象，不接受整页截图或整页生图。

## 能做什么

- 从用户上传的 PPT、文稿、提纲和备注中提取授权内容
- 先生成完整演讲稿并等待用户确认
- 把内容整理为叙事主线并切分成逐页蓝图
- 先生成包含页码、标题、时长、屏幕文案、现场讲稿、转场和视觉建议的逐页内容稿
- 分页确认后再询问固定模板或自定义风格
- 先生成封面、普通内容页和复杂页三页视觉样稿，确认后再做全套
- 自动检查必讲内容是否遗漏、重复或失去来源映射
- 根据内容和用户模板生成一套新的可编辑 PPT
- 美化现有 `.pptx`，保留原始模板和母版结构
- 重构正式文字型封面、卡片、流程、指标、案例和收尾页
- 统一颜色、层级、留白、图标和图片风格
- 调用 ImageGen 生成封面主视觉或页面插画
- 保留文字和简单图形的可编辑性
- 保证标题、正文、卡片、流程、图表和页码原生可编辑
- 自动识别并拒绝疑似整页图片化、扁平化的内容页
- 给每页加入 `[现场讲稿]` 和 `[转场]` 提词器
- 自动导出逐页 PNG、布局 JSON 和整套预览图
- 检查文字溢出、图片裁切和模板完整性
- 通过通用执行引擎重复生成和迭代整套 PPT

## 核心原则

1. **先理解内容，再决定页数和版式**
2. **每页只有一个主要叙事任务和核心结论**
3. **必讲内容必须可追踪，不能在拆页过程中丢失**
4. **保留模板，而不是重新套模板**
5. **参考稿默认只参考风格，不带入内容**
6. **图片只负责背景、照片、纹理或无文字插画**
7. **所有语义文字和结构必须原生可编辑**
8. **每次生成都经过内容、渲染和视觉 QA**

## 封面原则

- 正常大会封面默认只保留会议标识、标题、副标题、演讲者姓名和职位。
- 模板背景本身已有足够视觉识别时，不强制添加插图。
- 封面禁止使用关系图、飞轮、流程图、能力模型、内容卡片组或带文字节点的解释图。
- 确需主视觉时，图片必须从属于标题，不能与主题和讲者信息争夺焦点。
- 用户先要求全页插图、后明确要求文字型封面时，以后者为准，并在视觉计划中记录例外。

## 仓库结构

```text
.
├── README.md
└── polish-ppt-decks/
    ├── SKILL.md
    ├── agents/
    │   └── openai.yaml
    ├── scripts/
    │   ├── helpers.mjs
    │   ├── init_deck_workspace.mjs
    │   ├── recrop_illustration_sheets.mjs
    │   ├── render_page_content.mjs
    │   ├── run_transform.mjs
    │   ├── validate_approval_ledger.mjs
    │   ├── validate_content_plan.mjs
    │   ├── validate_editability.mjs
    │   ├── validate_illustration_assets.mjs
    │   ├── validate_prompter.mjs
    │   └── validate_visual_details.mjs
    └── references/
        ├── approval-gates.md
        ├── content-to-deck.md
        ├── design-rules.md
        ├── transform-patterns.md
        ├── visual-coverage.md
        └── workflow.md
```

## 安装

克隆仓库后，将 Skill 目录复制到个人 Codex Skills 目录：

```bash
git clone <YOUR_REPOSITORY_URL>
cd polish-ppt-decks
cp -R polish-ppt-decks ~/.codex/skills/
```

重新打开 Codex 或新建任务后，即可通过 `$polish-ppt-decks` 调用。

## 发布到 GitHub 或 GitLab

先在 GitHub 或 GitLab 创建一个空仓库，然后在当前目录执行：

```bash
git add .
git commit -m "Initial release of polish-ppt-decks"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

如果远程仓库已经包含 README 或其他提交，请先拉取并处理历史差异，不要直接强制推送覆盖。

## 使用示例

### 根据上传内容生成 PPT

```text
$polish-ppt-decks 根据我上传的内容稿生成一套PPT。
先生成一份逐页内容稿供我审阅，再使用我提供的模板生成，
所有标题、正文、图表和结构都要可编辑。
```

默认不会一步到位。Skill 会依次等待确认：

```text
内容范围
→ 完整演讲稿
→ 逐页内容
→ 固定模板或视觉风格
→ 三页视觉样稿
→ 完整PPT
```

### 重新编排内容型 PPT

```text
$polish-ppt-decks 这份PPT主要是内容素材，不要保留原页数。
提取全部必讲内容，合并重复部分、拆分过密页面，
重新生成一套逻辑完整、适合30分钟分享的可编辑PPT。
```

### 美化现有 PPT

```text
$polish-ppt-decks 美化这个PPT，保留原模板、Logo和页脚，
类似页面统一优化，最终文件需要保持可编辑。
```

### 参考图片风格

```text
$polish-ppt-decks 参考我提供的页面风格美化这套PPT。
参考稿只用于视觉风格，不使用其中的文字、数据、案例和结构。
不要更换模板；图片中不要生成文字，所有标题、正文和结构需要可编辑。
```

### 加入演讲提词器

```text
$polish-ppt-decks 给每页加入简洁提词器。
备注里只保留[现场讲稿]和[转场]，最后一页使用[结束]。
```

### 统一修改同类页面

```text
$polish-ppt-decks 检查所有卡片页和流程页。
修复文字对比度、布局松散、卡片单调和流程不清晰的问题。
```

## 工作方式

Skill 会引导 Codex执行以下流程：

```text
确认内容范围与目标
    ↓
生成并确认完整演讲稿
    ↓
生成并确认逐页内容
    ↓
询问并确认模板/风格
    ↓
生成并确认三页视觉样稿
    ↓
检查审批记录
    ↓
建立模板映射
    ↓
生成可编辑Starter Deck
    ↓
编写当前PPT专用Transform
    ↓
替换文字、结构和图片
    ↓
逐页渲染与检查
    ↓
模板完整性与溢出测试
    ↓
可编辑性与扁平化检测
    ↓
输出最终PPTX
```

其中：

- `init_deck_workspace.mjs` 创建标准工作区
- `validate_approval_ledger.mjs` 阻止未确认阶段直接进入完整 PPT 生成
- `validate_content_plan.mjs` 检查逐页蓝图、内容覆盖和来源映射
- `render_page_content.mjs` 生成并核对可审阅的逐页内容稿
- `run_transform.mjs` 运行当前 PPT 的页面修改逻辑
- `helpers.mjs` 提供图片、形状、备注和 QA 辅助函数
- `validate_prompter.mjs` 检查演讲者备注格式
- `validate_editability.mjs` 检查疑似整页图片化和缺少原生可编辑内容的页面

## 提词器格式

当用户要求简洁演讲者备注时，默认格式为：

```text
[现场讲稿]
本页实际讲解内容。

[转场]
进入下一页的自然衔接。
```

最后一页使用：

```text
[结束]
谢谢大家，欢迎交流。
```

完整逐字稿、来源记录和制作说明应保存在任务工作区，不应挤进演讲者视图。

## 依赖

- Codex
- Codex 的 `presentations` Skill
- `@oai/artifact-tool`
- 可选：Codex 的 `imagegen` Skill
- LibreOffice 或 PowerPoint，用于最终兼容性检查

Skill 本身不包含任何模型 API Key，也不要求把 API Key 写入仓库。

## 已验证

当前版本已经完成：

- Skill 结构验证
- JavaScript 语法检查
- 45 页 PPT 导入、逐页渲染和重新导出
- 45 页演讲者备注格式检查
- 可编辑性与疑似扁平化页面检测
- 内容清单、逐页蓝图和必讲内容覆盖验证

## 限制

- 不同 PPT 的形状名称、母版和内容结构不同，因此每套 PPT 仍需要一个专用 `transform.mjs`
- 图片生成结果通常需要人工视觉检查和一至两轮迭代
- 无法保证所有第三方字体在不同电脑上完全一致
- 复杂动画、SmartArt 和特殊插件对象可能需要 PowerPoint 手工确认

## 公开分享前注意

- 不要提交客户 PPT、内部数据、生成过程中的私密素材或未授权图片
- 不要把仅用于风格参考的旧 PPT 内容带入示例、测试文件或最终输出
- 不要提交任务工作区里的 `source.pptx`、最终成品或临时渲染目录
- 发布前请选择许可证；如果希望其他人自由使用和修改，可以考虑 MIT License
- 如果仓库没有许可证，其他人通常只能查看代码，并不自动获得复制、修改和再发布授权

## 推荐仓库简介

> A Codex Skill for turning uploaded content into structured editable PowerPoint decks, preserving templates, generating visuals, adding presenter notes, and running automated content and presentation QA.
