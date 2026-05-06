// ---------------------------------------------------------------------------
// specreview update — orchestration layer
// ---------------------------------------------------------------------------

import { exec } from 'child_process';
import { promisify } from 'util';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import ora from 'ora';
import chalk from 'chalk';
import { TOOLS, CONFIG_FILES, CONFIG_YAML } from '../constants.js';
import { FileService } from '../services/file-service.js';
import { TemplateService } from '../services/template-service.js';
import { ToolService } from '../services/tool-service.js';
import { validateConfigYaml } from '../services/config-validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, __dirname.includes('/dist/') ? '../../' : '../');
const TEMPLATES_DIR = resolve(rootDir, 'templates');
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8')) as { version: string };
const CURRENT_VERSION = pkg.version;

const execAsync = promisify(exec);

export async function update({ projectPath }: { projectPath: string }) {
  console.log(chalk.bold('\n  specreview update'));
  console.log(`  ${chalk.dim(`Source version: v${CURRENT_VERSION}`)}\n`);

  const projectFs = new FileService(projectPath);
  const templateSvc = new TemplateService(TEMPLATES_DIR);
  const toolSvc = new ToolService(TOOLS, projectFs);

  const npmUpdated = await updateNpmPackage();

  const configured = detectConfiguredTools(projectFs, toolSvc);

  if (configured.length === 0) {
    console.log('  No existing specreview configuration found. Run `specreview init` first.\n');
    return;
  }

  console.log(`  Found specreview in: ${configured.map((t) => t.name).join(', ')}`);

  const skillSpinner = ora({ text: 'Updating skills...', color: 'gray' }).start();
  const skillContent = templateSvc.getSkillContent();
  let skillUpdated = 0;

  for (const tool of configured) {
    const skillFile = join(tool.dir, 'skills', 'specreview', 'SKILL.md');
    projectFs.write(skillFile, skillContent);
    skillUpdated++;
  }

  skillSpinner.succeed(`Skills: ${skillUpdated} SKILL.md files updated`);

  syncConfigFiles(projectFs, templateSvc);

  console.log();
  console.log(chalk.bold('  Update Complete'));
  console.log();
  if (npmUpdated) {
    console.log(`  ${chalk.green('✔')} specreview npm package  ${chalk.dim('updated to latest')}`);
  }
  console.log(`  ${chalk.green('✔')} SKILL.md               ${chalk.dim('overwritten')}`);
  console.log(
    `  ${chalk.green('✔')} Config / role checks   ${chalk.dim('synced (customizations preserved)')}`,
  );
  console.log();
  console.log(`${chalk.dim('Restart your AI assistant for updated skills to take effect.')}`);
  console.log();
}

async function updateNpmPackage(): Promise<boolean> {
  const npmSpinner = ora({ text: 'Checking for specreview updates...', color: 'gray' }).start();

  try {
    const { stdout: installedJson } = await execAsync('npm list -g specreview --depth=0 --json', {
      timeout: 10000,
    });
    const parsed = JSON.parse(installedJson) as { dependencies?: Record<string, { version: string }> };
    const installedVersion = parsed.dependencies?.specreview?.version;

    const { stdout: latestVersion } = await execAsync('npm view specreview version', { timeout: 10000 });
    const latest = latestVersion.trim();

    if (installedVersion) {
      npmSpinner.text = `Current: v${installedVersion}  →  Latest: v${latest}`;
    }

    if (installedVersion === latest) {
      npmSpinner.succeed(`Already at latest version (v${latest})`);
      return false;
    }

    npmSpinner.text = `Updating from v${installedVersion} to v${latest}...`;
    const { stderr } = await execAsync('npm install -g specreview@latest', { timeout: 30000 });

    if (stderr && stderr.includes('npm ERR')) {
      npmSpinner.warn(`npm warning:\n${stderr}`);
      return false;
    }

    const { stdout: verifyJson } = await execAsync('npm list -g specreview --depth=0 --json', {
      timeout: 10000,
    });
    const verifyParsed = JSON.parse(verifyJson) as { dependencies?: Record<string, { version: string }> };
    const newVersion = verifyParsed.dependencies?.specreview?.version;

    if (newVersion === latest) {
      npmSpinner.succeed(`Updated to v${latest} ✓`);
      return true;
    } else {
      npmSpinner.warn(
        `Install ran but version is still v${newVersion}. Try "npm install -g specreview@${latest}" manually.`,
      );
      return false;
    }
  } catch (err: unknown) {
    const error = err as Error & { code?: string; killed?: boolean; stderr?: string };
    if (error.code === 'ENOENT') {
      npmSpinner.fail('npm not found — is Node.js/npm installed?');
    } else if (error.killed) {
      npmSpinner.warn('npm update timed out after 30s; check your network connection');
    } else if (error.stderr?.includes('EACCES') || error.stderr?.includes('EPERM')) {
      npmSpinner.warn('Permission error — try running with sudo or fix npm permissions');
    } else if (error.stderr?.includes('not found') || error.stderr?.includes('404')) {
      npmSpinner.warn('specreview package not found in registry; skipping npm update');
    } else {
      npmSpinner.warn(`npm update skipped: ${(error.stderr || error.message || 'unknown error').trim()}`);
    }
    return false;
  }
}

function detectConfiguredTools(projectFs: FileService, toolSvc: ToolService) {
  return toolSvc.getAll().filter((t) => {
    return projectFs.exists(join(t.dir, 'skills', 'specreview', 'SKILL.md'));
  });
}

function syncConfigFiles(projectFs: FileService, templateSvc: TemplateService) {
  console.log();
  console.log(chalk.bold('  Config & Role Checks'));
  console.log();

  const specreviewDir = 'specreview';
  const configDir = join(specreviewDir, 'config');

  const freshYaml = templateSvc.getConfigYaml();
  validateConfigYaml(freshYaml, { expectedRoles: true });

  const yamlPath = join(specreviewDir, CONFIG_YAML);
  if (projectFs.exists(yamlPath)) {
    console.log(
      `  ${chalk.green('✔')} ${CONFIG_YAML.padEnd(20)} ${chalk.dim('preserved (your customizations kept)')}`,
    );
  } else {
    projectFs.write(yamlPath, freshYaml);
    console.log(
      `  ${chalk.cyan('+')} ${CONFIG_YAML.padEnd(20)} ${chalk.dim('created (new in this version)')}`,
    );
  }

  for (const file of CONFIG_FILES) {
    const filePath = join(configDir, file);
    if (projectFs.exists(filePath)) {
      console.log(
        `  ${chalk.green('✔')} ${file.padEnd(20)} ${chalk.dim('preserved (your customizations kept)')}`,
      );
    } else {
      const content = templateSvc.getRoleCheckFile(file);
      projectFs.write(filePath, content);
      console.log(`  ${chalk.cyan('+')} ${file.padEnd(20)} ${chalk.dim('created (new in this version)')}`);
    }
  }
}
