// ---------------------------------------------------------------------------
// specreview — shared constants
// Single source of truth for tool definitions, config file names, and roles.
// ---------------------------------------------------------------------------

export interface ToolDef {
  id: string;
  name: string;
  dir: string;
}

export interface RoleDef {
  id: string;
  title: string;
  priority: number;
  description: string;
  icon: string;
}

/** Supported AI tool definitions — each entry maps to a known skill directory. */
export const TOOLS: readonly ToolDef[] = Object.freeze([
  { id: 'claude', name: 'Claude Code', dir: '.claude' },
  { id: 'cursor', name: 'Cursor', dir: '.cursor' },
  { id: 'windsurf', name: 'Windsurf', dir: '.windsurf' },
  { id: 'github-copilot', name: 'GitHub Copilot', dir: '.github' },
  { id: 'cline', name: 'Cline', dir: '.cline' },
  { id: 'roocode', name: 'RooCode', dir: '.roo' },
  { id: 'codex', name: 'Codex CLI', dir: '.codex' },
  { id: 'warp', name: 'Warp', dir: '.warp' },
]);

/** Role-check file names (written to specreview/config/). */
export const CONFIG_FILES: readonly string[] = Object.freeze([
  'code-check.md',
  'logic-check.md',
  'spec-check.md',
  'perf-check.md',
  'dep-check.md',
  'security-check.md',
  'test-check.md',
]);

export const CONFIG_YAML = 'config.yaml';

/** Role metadata — the canonical role definitions. */
export const ROLES: readonly RoleDef[] = Object.freeze([
  {
    id: 'code-check',
    title: '代码审查员',
    priority: 10,
    description: '可读性、命名、DRY、注释、代码风格',
    icon: '🔍',
  },
  {
    id: 'logic-check',
    title: '逻辑审查员',
    priority: 20,
    description: '边界条件、分支覆盖、循环终止、状态流转',
    icon: '⚙️',
  },
  {
    id: 'spec-check',
    title: '需求审查员',
    priority: 25,
    description: '需求覆盖、范围控制、设计偏差',
    icon: '📋',
  },
  {
    id: 'perf-check',
    title: '性能审查员',
    priority: 30,
    description: 'N+1、循环耗时操作、资源释放',
    icon: '⚡',
  },
  {
    id: 'dep-check',
    title: '依赖审查员',
    priority: 40,
    description: '依赖必要性、版本兼容、安全漏洞',
    icon: '🔗',
  },
  {
    id: 'security-check',
    title: '安全审查员',
    priority: 60,
    description: '注入防护、敏感信息、权限校验',
    icon: '🛡️',
  },
  {
    id: 'test-check',
    title: '测试审查员',
    priority: 70,
    description: '异常捕获、超时重试、日志记录、降级策略',
    icon: '🧪',
  },
]);
