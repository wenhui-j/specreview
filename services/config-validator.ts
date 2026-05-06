// ---------------------------------------------------------------------------
// config-validator — validates generated config.yaml structure
// ---------------------------------------------------------------------------
// Catches structural issues before the AI tries to read the config.
// Designed to work without a YAML dependency by pattern-matching known keys.
// ---------------------------------------------------------------------------

import { ROLES } from '../constants.js';

interface ValidateOptions {
  expectedRoles?: boolean;
}

/**
 * Validate the content of a config.yaml file.
 * Throws an informative Error if the structure is broken.
 */
export function validateConfigYaml(content: string, options: ValidateOptions = {}): true {
  const { expectedRoles = true } = options;
  const errors: string[] = [];

  // Check top-level keys
  if (!/\nroles:/.test(content) && !/^roles:/.test(content)) {
    errors.push('Missing top-level "roles:" key');
  }
  if (!/\nreport:/.test(content) && !/^report:/.test(content)) {
    errors.push('Missing top-level "report:" key');
  }

  // Extract role IDs
  const roleIds = extractRoleIds(content);

  // Check role structure
  const requiredProps = ['title:', 'description:', 'enabled:', 'priority:'];
  for (const roleId of roleIds) {
    const section = extractRoleSection(content, roleId);
    const sectionLines = section.split('\n').map((l) => l.trim());

    for (const prop of requiredProps) {
      const propName = prop.replace(':', '');
      if (!sectionLines.some((l) => l.startsWith(prop))) {
        errors.push(`Role "${roleId}" is missing required property "${propName}"`);
      }
    }

    const enabledLine = section.split('\n').find((l) => l.trim().startsWith('enabled:'));
    if (enabledLine && !/enabled:\s*(true|false)/.test(enabledLine.trim())) {
      errors.push(`Role "${roleId}": "enabled" should be true or false (got: ${enabledLine.trim()})`);
    }

    const priorityLine = section.split('\n').find((l) => l.trim().startsWith('priority:'));
    if (priorityLine) {
      const match = priorityLine.trim().match(/priority:\s*(\S+)/);
      if (match && !/^\d+$/.test(match[1])) {
        errors.push(`Role "${roleId}": "priority" should be an integer (got: ${match[1]})`);
      }
    }
  }

  // Check that all expected roles are present
  if (expectedRoles) {
    const expectedIds = ROLES.map((r) => r.id);
    const missing = expectedIds.filter((id) => !roleIds.includes(id));
    if (missing.length > 0) {
      errors.push(`Missing expected roles: ${missing.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Config validation failed (${errors.length} issue(s)):\n` + errors.map((e) => `  • ${e}`).join('\n'),
    );
  }

  return true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractRoleIds(content: string): string[] {
  const rolesMatch = content.match(/(?:^|\n)roles:\n([\s\S]*?)(?=\n\S|\n*$)/);
  if (!rolesMatch) {
    return [];
  }

  const section = rolesMatch[1];
  const ids: string[] = [];
  const regex = /^ {2}([\w-]+):\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(section)) !== null) {
    if (
      match[1] === 'enabled' ||
      match[1] === 'title' ||
      match[1] === 'description' ||
      match[1] === 'priority'
    ) {
      continue;
    }
    ids.push(match[1]);
  }
  return ids;
}

function extractRoleSection(content: string, roleId: string): string {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === `${roleId}:`);
  if (startIdx === -1) {
    return '';
  }

  const sectionLines: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (
      /^\S/.test(lines[i]) ||
      (lines[i].length > 0 && !lines[i].startsWith('    ') && !lines[i].startsWith('  -'))
    ) {
      break;
    }
    sectionLines.push(lines[i]);
  }
  return sectionLines.join('\n');
}
