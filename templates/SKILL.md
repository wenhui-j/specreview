---
name: specreview
description: Multi-role code review for code changes — runs code, logic, spec, perf, dep, security, and test checks against modified files.
license: MIT
compatibility: Requires openspec CLI and openspec/changes/ directory structure.
metadata:
  author: specreview
  version: "1.0"
---

# specreview — 多角色代码审查

**触发方式：**
- `/specreview <spec-name>` — 对指定 spec 进行多角色代码审查
- `/specreview init` — 自定义角色配置（添加、编辑、启用/禁用角色）

---

## 项目结构说明

所有文件路径均相对于**项目根目录**，而非技能文件所在目录：

```
.claude/skills/specreview/SKILL.md   ← 当前技能文件（勿手动编辑）
specreview/config.yaml                ← 角色配置（所有自定义在此添加）
specreview/config/                    ← 角色检查文件（.md）
openspec/changes/{spec-name}/         ← OpenSpec 变更目录
```

---

## /specreview init — 添加自定义角色

### 歧义处理

`init` 也可能是某个 spec 的名称。当用户输入 `/specreview init` 时：

1. 检查 `openspec/changes/init/` 目录是否存在
2. **如果存在**：使用 **AskUserQuestion** 询问用户意图：
   > 标题：「「init」存在歧义」
   > 选项 A：「添加自定义审查角色」— 进入角色创建流程
   > 选项 B：「审查 init spec」— 对 init 这个 spec 进行代码审查
3. **如果不存在**：直接进入角色创建流程

### 角色创建流程

### Step 1：读取当前配置

读取 `specreview/config.yaml`，解析所有角色。输出当前配置摘要，让用户了解已有角色的优先级范围：

```markdown
当前角色配置（共 N 个角色）：

| 角色 | 优先级 | 状态 |
|------|--------|------|
| 代码审查员 | 10 | ✅ 启用 |
| 逻辑审查员 | 20 | ✅ 启用 |
| ... | ... | ... |
```

### Step 2：收集新角色信息

**A. 角色名称**
展示已有角色名作为参考：
> 现有内置角色：代码审查员、逻辑审查员、需求审查员、性能审查员、依赖审查员、安全审查员、测试审查员（可自定义添加更多角色）
> 问：「新角色叫什么名字？」

**B. 角色 ID（用于文件名）**
> 问：「角色 ID 是什么？（如 `api-check`。直接回车则根据名称自动生成 kebab-case 格式）」

**C. 检查要点**
先扫描项目 tech stack（读取 `package.json`、框架配置文件、源文件等），然后结合用户输入的角色名称和项目实际技术栈，自动生成 4~5 个具体、贴合项目的检查要点建议，以列表形式展示给用户。用户通过对话自由选择、修改或自行输入自定义检查要点，无数量限制。

**D. 优先级**
> 参考当前角色优先级范围（如 10~70），问：「优先级是多少？（数字，越小越先执行）」

### Step 3：确认并写入

收集完信息后，展示即将生成的内容摘要：
> 问：「即将添加以下角色，确认写入？
> - 名称：API 审查员
> - ID：api-check
> - 检查要点：注入防护、权限校验、敏感信息
> - 优先级：25
>
> 将生成配置文件：
> `specreview/config/api-check.md`

用户确认后执行（以下路径均为项目根目录下）：
1. 在 `specreview/config.yaml` 的 `roles:` 下追加新角色条目，设 `enabled: true`
2. 在 `specreview/config/` 下创建 `{role-id}.md`，格式参考 `specreview/config/` 下已有角色文件：

```markdown
---
name: {role-id}
description: {检查要点简述}
role: {角色名称}
priority: {优先级}
---

# {角色名称}

## Persona
{根据检查要点自动生成的角色描述}

## 检查要点（只针对改动区域）

{根据用户选择的检查要点分类，逐个生成检查项}

## 报告格式

| 文件 | 行号 | 问题描述 | 严重程度 | 建议 |
|------|------|----------|----------|------|
```

3. 告知：「✅ 角色「API 审查员」已添加，将在下次 `/specreview` 审查时生效」

---

## 工作流程

### Step 1：解析输入

从用户消息中提取 `<spec-name>`：

- `/specreview change-table` → spec 名称 = `change-table`
- 如果没有提供 spec 名称，使用 **AskUserQuestion** 询问："想 review 哪个 spec？请输入 OpenSpec change 名称（如 `change-table`）"

### Step 2：定位 Spec 目录

读取 OpenSpec change 目录：

```
openspec/changes/{spec-name}/
├── proposal.md       → "Impact" 段落列出了所有受影响文件
├── design.md         → 技术决策和架构设计
├── spec.md           → 需求规格和验收标准
└── tasks.md          → 具体任务和改动细节
```

如果目录不存在，告知用户该 spec 不存在，提示先运行 `/opsx:propose` 创建它。

### Step 3：识别受影响的源文件

依次读取 `spec.md`、`proposal.md`、`design.md`、`tasks.md` 四个文件，获取完整上下文。

从 spec 文件中提取文件列表：
1. **proposal.md 的 "Impact" 段落** — 主要文件清单
2. **tasks.md** — 每个任务涉及的具体文件
3. **design.md** — 模块/文件结构和数据流中提到的文件
4. **spec.md** — 需求规格中提到的模块和边界

列出所有受影响的源文件（排除 openspec/ 目录自身的文档），按项目实际使用的语言/框架类型识别。

### Step 4：读取源文件

读取每个受影响文件的完整内容。同时也读取与改动相关的上下游文件（如调用方、被调用方、依赖的模块定义等），确保理解上下文。

### Step 5：多角色审查

读取 `specreview/config.yaml` 获取所有角色及其优先级顺序。

使用 **TodoWrite** 跟踪审查进度。

按 priority 升序，对每个角色：

1. 读取 `specreview/config/{role}.md` 文件，获取检查标准
2. 根据角色的检查要点审查源文件
3. 生成结构化审查输出，格式：

```markdown
### [角色名]

| 文件 | 行号 | 问题描述 | 严重程度 | 建议 |
|------|------|----------|----------|------|
| ...  | ...  | ...      | high/mid/low | ...  |
```

零问题则注明「全部通过 ✅」。

### Step 6：汇总报告

将所有角色的审查结果编译为最终报告，包含：

```
┌──────────────────────────────────────────────┐
│           specreview 审查报告                  │
│           Spec: change-table                  │
│           审查日期: 2026-05-05                 │
├──────────────────────────────────────────────┤
│                                              │
│  受影响文件: file1.js, file2.py, ...         │
│                                              │
│  ┌─ 代码审查员 ────────────────────────────┐ │
│  │  通过 ✅                                  │ │
│  └──────────────────────────────────────────┘ │
│  ┌─ 逻辑审查员 ────────────────────────────┐ │
│  │  2 个问题 (1 high, 1 low)                 │ │
│  └──────────────────────────────────────────┘ │
│  ... (更多角色)                                │
│                                              │
│  ★ 重点行动项:                                │
│  1. [高] file.py:12 — 集合越界风险            │
│  2. [中] ...                                  │
└──────────────────────────────────────────────┘
```

### Step 7：输出结果

向用户展示完整审查报告。如果发现问题，询问是否需要自动修复。

---

## 角色列表

| 角色 | 文件 | 优先级 | 关注领域 |
|------|------|--------|----------|
| 代码审查员 | `specreview/config/code-check.md` | 10 | 可读性、命名、DRY、注释、代码风格 |
| 逻辑审查员 | `specreview/config/logic-check.md` | 20 | 边界条件、分支覆盖、循环终止、状态流转 |
| 需求审查员 | `specreview/config/spec-check.md` | 25 | 需求覆盖、范围控制、设计偏差 |
| 性能审查员 | `specreview/config/perf-check.md` | 30 | N+1、循环耗时操作、资源释放 |
| 依赖审查员 | `specreview/config/dep-check.md` | 40 | 依赖必要性、版本兼容、安全漏洞 |
| 安全审查员 | `specreview/config/security-check.md` | 60 | 注入防护、敏感信息、权限校验 |
| 测试审查员 | `specreview/config/test-check.md` | 70 | 异常捕获、超时重试、日志记录、降级策略 |

> 以上为内置角色。如需添加自定义角色（如 API 审查、TypeScript 类型检查等），参考 `/specreview init` 流程或直接编辑 `specreview/config.yaml` 在 `roles:` 下追加。

---

## 审查原则

- **只审查改动区域**，不审查整个项目
- **客观表述**，基于代码事实，不主观臆断
- **严重程度分级**：high（必须修复）/ mid（建议修复）/ low（仅供参考）
- **零问题 = 通过**，不需要编造发现
- **需求审查**是最重要的角色——代码必须满足需求规格
