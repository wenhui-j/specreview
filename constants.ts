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
  { id: 'amazon-q', name: 'Amazon Q Developer', dir: '.amazonq' },
  { id: 'antigravity', name: 'Antigravity', dir: '.agent' },
  { id: 'auggie', name: 'Auggie (Augment CLI)', dir: '.augment' },
  { id: 'bob', name: 'Bob Shell', dir: '.bob' },
  { id: 'claude', name: 'Claude Code', dir: '.claude' },
  { id: 'cline', name: 'Cline', dir: '.cline' },
  { id: 'codebuddy', name: 'CodeBuddy Code (CLI)', dir: '.codebuddy' },
  { id: 'codex', name: 'Codex CLI', dir: '.codex' },
  { id: 'continue', name: 'Continue', dir: '.continue' },
  { id: 'costrict', name: 'CoStrict', dir: '.cospec' },
  { id: 'crush', name: 'Crush', dir: '.crush' },
  { id: 'cursor', name: 'Cursor', dir: '.cursor' },
  { id: 'factory', name: 'Factory Droid', dir: '.factory' },
  { id: 'forgecode', name: 'ForgeCode', dir: '.forge' },
  { id: 'gemini', name: 'Gemini CLI', dir: '.gemini' },
  { id: 'github-copilot', name: 'GitHub Copilot', dir: '.github' },
  { id: 'iflow', name: 'iFlow', dir: '.iflow' },
  { id: 'junie', name: 'Junie', dir: '.junie' },
  { id: 'kilocode', name: 'Kilo Code', dir: '.kilocode' },
  { id: 'kimi', name: 'Kimi CLI', dir: '.kimi' },
  { id: 'kiro', name: 'Kiro', dir: '.kiro' },
  { id: 'lingma', name: 'Lingma', dir: '.lingma' },
  { id: 'opencode', name: 'OpenCode', dir: '.opencode' },
  { id: 'pi', name: 'Pi', dir: '.pi' },
  { id: 'qoder', name: 'Qoder', dir: '.qoder' },
  { id: 'qwen', name: 'Qwen Code', dir: '.qwen' },
  { id: 'roocode', name: 'RooCode', dir: '.roo' },
  { id: 'trae', name: 'Trae', dir: '.trae' },
  { id: 'windsurf', name: 'Windsurf', dir: '.windsurf' },
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
