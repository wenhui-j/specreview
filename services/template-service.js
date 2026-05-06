// ---------------------------------------------------------------------------
// TemplateService — reads and (optionally) renders templates
// ---------------------------------------------------------------------------

import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ROLES } from '../constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATES_DIR = resolve(__dirname, '..', 'templates');

/**
 * Manages access to specreview's built-in template files.
 *
 * @example
 *   const ts = new TemplateService();
 *   const skill = ts.read('SKILL.md');
 *   const yaml  = ts.read('config', 'config.yaml');
 */
export class TemplateService {
  /**
   * @param {string} [templatesDir] – path to the templates/ directory.
   */
  constructor(templatesDir = DEFAULT_TEMPLATES_DIR) {
    this.templatesDir = resolve(templatesDir);
  }

  // ── Public API ───────────────────────────────────────────────────────

  /**
   * Read a template file. Accepts path segments (like path.join).
   * @param  {...string} segments
   * @returns {string}
   */
  read(...segments) {
    const fullPath = join(this.templatesDir, ...segments);

    let content;
    try {
      content = fsReadSync(fullPath);
    } catch {
      throw new Error(`Template not found: ${segments.join('/')}`);
    }
    return content;
  }

  /** Convenience: read SKILL.md. */
  getSkillContent() {
    return this.read('SKILL.md');
  }

  /** Convenience: read config.yaml. */
  getConfigYaml() {
    return this.read('config', 'config.yaml');
  }

  /** Convenience: read a role-check file by name (e.g. "code-check.md"). */
  getRoleCheckFile(name) {
    return this.read('config', name);
  }

  /**
   * Dynamically render the role table for SKILL.md from constants.
   * This eliminates the need to manually keep the role table in SKILL.md
   * in sync with config.yaml.
   *
   * @returns {string} – a markdown table of roles sorted by priority.
   */
  renderRoleTable() {
    const sorted = [...ROLES].sort((a, b) => a.priority - b.priority);

    const header = `| ${'角色'.padEnd(16)} | ${'文件'.padEnd(32)} | ${'优先级'.padEnd(8)} | ${'关注领域'.padEnd(30)} |`;
    const sep    = `|${''.padEnd(18, '-')}|${''.padEnd(34, '-')}|${''.padEnd(10, '-')}|${''.padEnd(32, '-')}|`;
    const rows = sorted.map(r =>
      `| ${r.title.padEnd(16)} | ${`specreview/config/${r.id}.md`.padEnd(32)} | ${String(r.priority).padEnd(8)} | ${r.description.padEnd(30)} |`
    );

    return [header, sep, ...rows].join('\n');
  }
}

// ---------------------------------------------------------------------------
// Inline fs helper (avoids coupling FileService for a simple read)
// ---------------------------------------------------------------------------
import { readFileSync, existsSync } from 'fs';

function fsReadSync(p) {
  if (!existsSync(p)) { throw new Error('not found'); }
  return readFileSync(p, 'utf-8');
}
