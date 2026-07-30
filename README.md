# polish-ppt-decks

一套面向 Codex 的 PowerPoint 视觉精修 Skill。

它不是固定模板，也不是“一键换皮”工具，而是一套可复用的 PPT 制作流水线：在保留用户原始模板、Logo、页脚和可编辑结构的前提下，让 Codex 完成逐页诊断、视觉重构、图片生成、演讲者备注、渲染检查和模板完整性验证。

> **重要默认规则：参考 PPT 和截图只用于学习风格，不用于提取内容。**
> 未经用户明确授权，不复制参考稿的文字、数据、案例、图表、故事线或页面顺序。最终标题、正文、卡片、流程、图表和页码必须是 PowerPoint 原生可编辑对象，不接受整页截图或整页生图。

## 能做什么

- 美化现有 `.pptx`，保留原始模板和母版结构
- 重构封面、卡片、流程、指标、案例和收尾页
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

1. **保留模板，而不是重新套模板**
2. **先诊断问题，再增加视觉元素**
3. **优先做减法，避免层级和装饰堆叠**
4. **参考稿默认只参考风格，不带入内容**
5. **图片只负责背景、照片、纹理或无文字插画**
6. **所有语义文字和结构必须原生可编辑**
7. **每次修改都经过完整渲染和 QA**

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
    │   ├── run_transform.mjs
    │   ├── validate_prompter.mjs
    │   └── validate_editability.mjs
    └── references/
        ├── design-rules.md
        ├── transform-patterns.md
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
检查原始PPT
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

> A Codex Skill for template-preserving PowerPoint beautification, AI-generated visuals, editable slide transforms, presenter notes, and automated presentation QA.
