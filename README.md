# specreview

多角色代码审查技能 —— 为 AI 编程助手添加 `/specreview` 命令，对使用 OpenSpec 框架下的指定 spec 涉及的代码变更进行多维度审查。支持 29+ 主流 AI 编程工具。

## 安装

```bash
npm install -g specreview
```

## CLI 命令

### `specreview init` — 初始化项目

在项目目录中生成配置文件与 AI 技能文件：

```bash
cd your-project
specreview init
```

也可以指定 AI 工具（跳过交互选择，支持逗号分隔的多个工具 ID）：

```bash
specreview init --tools claude,cursor,gemini,windsurf
```

如需覆盖已有配置：

```bash
specreview init --force
```

支持的所有 AI 工具：

| 工具                 | ID               | 目录         |
| -------------------- | ---------------- | ------------ |
| Amazon Q Developer   | `amazon-q`       | `.amazonq`   |
| Antigravity          | `antigravity`    | `.agent`     |
| Auggie (Augment CLI) | `auggie`         | `.augment`   |
| Bob Shell            | `bob`            | `.bob`       |
| Claude Code          | `claude`         | `.claude`    |
| Cline                | `cline`          | `.cline`     |
| CodeBuddy Code (CLI) | `codebuddy`      | `.codebuddy` |
| Codex CLI            | `codex`          | `.codex`     |
| Continue             | `continue`       | `.continue`  |
| CoStrict             | `costrict`       | `.cospec`    |
| Crush                | `crush`          | `.crush`     |
| Cursor               | `cursor`         | `.cursor`    |
| Factory Droid        | `factory`        | `.factory`   |
| ForgeCode            | `forgecode`      | `.forge`     |
| Gemini CLI           | `gemini`         | `.gemini`    |
| GitHub Copilot       | `github-copilot` | `.github`    |
| iFlow                | `iflow`          | `.iflow`     |
| Junie                | `junie`          | `.junie`     |
| Kilo Code            | `kilocode`       | `.kilocode`  |
| Kimi CLI             | `kimi`           | `.kimi`      |
| Kiro                 | `kiro`           | `.kiro`      |
| Lingma               | `lingma`         | `.lingma`    |
| OpenCode             | `opencode`       | `.opencode`  |
| Pi                   | `pi`             | `.pi`        |
| Qoder                | `qoder`          | `.qoder`     |
| Qwen Code            | `qwen`           | `.qwen`      |
| RooCode              | `roocode`        | `.roo`       |
| Trae                 | `trae`           | `.trae`      |
| Windsurf             | `windsurf`       | `.windsurf`  |

init 会在项目中生成：

```
.<tool-dir>/skills/specreview/SKILL.md   # AI 助手自动注册 /specreview 命令
specreview/config.yaml                   # 主配置（角色、优先级等）
specreview/config/                       # 角色检查文件 (.md)
```

### `specreview update` — 更新项目

更新全局 npm 包，并同步项目内的技能文件和配置（保留已有自定义内容）：

```bash
cd your-project
specreview update
```

更新时会保留你自定义的 `specreview/config.yaml` 和角色检查文件，仅覆盖 SKILL.md 模板。

## AI 命令

在 AI 编程助手中使用 `/specreview` 命令：

- `/specreview <spec-name>` — 对指定 spec 进行多角色代码审查
- `/specreview init` — 添加自定义审查角色（引导创建新角色并生成配置文件）

```
/specreview <spec-name>
```

例如审查 `change-table` 这个 OpenSpec change：

```
/specreview change-table
```

AI 会自动定位 `openspec/changes/change-table/` 目录，读取 spec 文档和改动的源文件，依次从所有已启用的角色视角进行审查并汇总报告。

## 角色说明

| 角色       | 关注领域                               |
| ---------- | -------------------------------------- |
| 代码审查员 | 可读性、命名、DRY、注释、代码风格      |
| 逻辑审查员 | 边界条件、分支覆盖、循环终止、状态流转 |
| 需求审查员 | 需求覆盖、范围控制、设计偏差           |
| 性能审查员 | N+1、循环耗时操作、资源释放            |
| 依赖审查员 | 依赖必要性、版本兼容、安全漏洞         |
| 安全审查员 | 注入防护、敏感信息、权限校验           |
| 测试审查员 | 异常捕获、超时重试、日志记录、降级策略 |

所有内置角色均为语言无关的通用检查。如需添加语言特定检查（TypeScript 类型断言、Rust 生命周期等），在 AI 助手中使用 `/specreview init` 交互式创建即可，AI 会自动生成角色配置和检查文件。

## 自定义

在 AI 助手中使用 `/specreview init` 交互式创建自定义角色，AI 会引导你完成角色名称、检查要点、优先级等配置，并自动生成对应的角色文件和配置。

## 许可证

MIT
