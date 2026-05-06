import { describe, it, expect } from 'vitest';
import { validateConfigYaml } from '../../services/config-validator.js';

const VALID_CONFIG = `
roles:
  code-check:
    title: 代码审查员
    description: 可读性、命名、DRY
    enabled: true
    priority: 10
  logic-check:
    title: 逻辑审查员
    description: 边界条件、分支覆盖
    enabled: true
    priority: 20

report:
  format: markdown
  group_by: role
  show_summary: true
  severity_labels:
    high: 🔴 高
    mid: 🟡 中
    low: 🟢 低
`;

describe('config-validator', () => {
  it('passes a valid config', () => {
    expect(validateConfigYaml(VALID_CONFIG, { expectedRoles: false })).toBe(true);
  });

  it('passes the real template config with full role validation', async () => {
    const { TemplateService } = await import('../../services/template-service.js');
    const svc = new TemplateService();
    const content = svc.getConfigYaml();
    expect(() => validateConfigYaml(content, { expectedRoles: true })).not.toThrow();
  });

  describe('error detection', () => {
    it('detects missing roles key', () => {
      expect(() => validateConfigYaml('report:\n  format: markdown', { expectedRoles: false })).toThrow(
        'roles',
      );
    });

    it('detects missing report key', () => {
      expect(() =>
        validateConfigYaml(
          'roles:\n  code-check:\n    title: x\n    enabled: true\n    priority: 10\n    description: x',
          { expectedRoles: false },
        ),
      ).toThrow('report');
    });

    it('detects missing required role properties', () => {
      const bad = `
roles:
  code-check:
    title: 代码审查员
    enabled: true
    priority: 10
`;
      expect(() => validateConfigYaml(bad, { expectedRoles: false })).toThrow(
        /missing required property.*description/i,
      );
    });

    it('flags non-boolean enabled value', () => {
      const bad = `
roles:
  code-check:
    title: 代码审查员
    description: test
    enabled: "yes"
    priority: 10
`;
      expect(() => validateConfigYaml(bad, { expectedRoles: false })).toThrow(
        /enabled.*should be true or false/i,
      );
    });

    it('flags non-integer priority', () => {
      const bad = `
roles:
  code-check:
    title: 代码审查员
    description: test
    enabled: true
    priority: high
`;
      expect(() => validateConfigYaml(bad, { expectedRoles: false })).toThrow(
        /priority.*should be an integer/i,
      );
    });

    it('detects missing expected roles', () => {
      const partial = `
roles:
  code-check:
    title: 代码审查员
    description: test
    enabled: true
    priority: 10

report:
  format: markdown
  group_by: role
  show_summary: true
  severity_labels:
    high: 🔴
`;
      expect(() => validateConfigYaml(partial, { expectedRoles: true })).toThrow(/missing expected roles/i);
    });
  });
});
