// ---------------------------------------------------------------------------
// specreview init — orchestration layer
// ---------------------------------------------------------------------------

import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import chalk from 'chalk';
import { checkbox, Separator } from '@inquirer/prompts';
import { TOOLS, CONFIG_FILES, CONFIG_YAML } from '../constants.js';
import type { ToolDef } from '../constants.js';
import { FileService } from '../services/file-service.js';
import { TemplateService } from '../services/template-service.js';
import { ToolService } from '../services/tool-service.js';
import { validateConfigYaml } from '../services/config-validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, __dirname.includes('/dist/') ? '../../' : '../');
const TEMPLATES_DIR = resolve(rootDir, 'templates');

export async function init({
  projectPath,
  tools,
  force = false,
}: {
  projectPath: string;
  tools?: string[];
  force?: boolean;
}) {
  console.log(chalk.bold('\n  specreview init\n'));

  const projectFs = new FileService(projectPath);
  const templateSvc = new TemplateService(TEMPLATES_DIR);
  const toolSvc = new ToolService(TOOLS, projectFs);

  // Step 1: Detect & select tools
  const detected = toolSvc.detect();
  if (detected.length > 0) {
    const names = detected.map((id) => toolSvc.findById(id)?.name || id);
    console.log(`  Detected: ${names.join(', ')}`);
  }

  let selectedTools: ToolDef[];
  if (tools) {
    selectedTools = toolSvc.filterByIds(tools);
    if (selectedTools.length === 0) {
      console.log(`  No supported tools in: ${tools.join(', ')}`);
      console.log(`  Available: ${TOOLS.map((t) => t.id).join(', ')}\n`);
      return;
    }
  } else {
    selectedTools = await interactiveSelect(toolSvc, detected);
  }

  if (selectedTools.length === 0) {
    console.log('  No tools selected. Nothing to do.\n');
    return;
  }

  // Step 2: Check existing config
  const configYamlPath = join('specreview', CONFIG_YAML);
  const configExists = projectFs.exists(configYamlPath);

  // Step 3: Write SKILL.md
  console.log();
  const skillSpinner = ora({ text: 'Generating skills...', color: 'gray' }).start();
  const skillContent = templateSvc.getSkillContent();
  const { createdCount, skippedCount } = writeSkillFiles(projectFs, selectedTools, skillContent, force);
  skillSpinner.succeed(
    `Skills: ${createdCount} created, ${skippedCount} skipped (${selectedTools.length} tools)`,
  );

  // Step 4: Write config + role files
  const configSpinner = ora({ text: 'Generating config...', color: 'gray' }).start();
  const snapshot: Array<{ path: string; existed: boolean; content: string | null }> = [];
  if (configExists && !force) {
    configSpinner.info('Config: specreview/ already exists (use --force to overwrite)');
  } else {
    const configFiles = [
      join('specreview', CONFIG_YAML),
      ...CONFIG_FILES.map((f) => join('specreview', 'config', f)),
    ];
    snapshot.push(...projectFs.takeSnapshot(configFiles));

    try {
      writeConfigFiles(projectFs, templateSvc);
      configSpinner.succeed(
        `Config: specreview/${CONFIG_YAML} + specreview/config/ (${CONFIG_FILES.length + 1} files)`,
      );
    } catch (err) {
      projectFs.restoreSnapshot(snapshot);
      configSpinner.fail(`Config generation failed — changes reverted: ${(err as Error).message}`);
      throw err;
    }
  }

  printSummary(selectedTools);
}

// ── Internal helpers ──

async function interactiveSelect(toolSvc: ToolService, detected: string[]): Promise<ToolDef[]> {
  const choices: Array<Separator | { name: string; value: string; checked: boolean }> = [
    new Separator(chalk.dim('───')),
    ...toolSvc.getAll().map((tool) => ({
      name: `${tool.name.padEnd(20)} (.${tool.dir}/)`,
      value: tool.id,
      checked: detected.includes(tool.id),
    })),
  ];

  const selected = await checkbox<string>({
    message: 'Select AI tools to set up:',
    choices,
    pageSize: 20,
    validate: (val) => val.length > 0 || 'Select at least one tool',
    loop: false,
  });

  return toolSvc.filterByIds(selected);
}

function writeSkillFiles(
  projectFs: FileService,
  selectedTools: ToolDef[],
  skillContent: string,
  force: boolean,
) {
  let createdCount = 0;
  let skippedCount = 0;

  for (const tool of selectedTools) {
    const skillFile = join(tool.dir, 'skills', 'specreview', 'SKILL.md');
    if (projectFs.exists(skillFile) && !force) {
      skippedCount++;
    } else {
      projectFs.write(skillFile, skillContent);
      createdCount++;
    }
  }

  return { createdCount, skippedCount };
}

function writeConfigFiles(projectFs: FileService, templateSvc: TemplateService) {
  const yamlContent = templateSvc.getConfigYaml();
  validateConfigYaml(yamlContent, { expectedRoles: true });

  projectFs.write(join('specreview', CONFIG_YAML), yamlContent);

  for (const file of CONFIG_FILES) {
    const content = templateSvc.getRoleCheckFile(file);
    projectFs.write(join('specreview', 'config', file), content);
  }
}

function printSummary(selectedTools: ToolDef[]) {
  console.log();
  console.log(chalk.bold('  Setup Complete'));
  console.log();

  for (const tool of selectedTools) {
    const relPath = `.${tool.dir}/skills/specreview/SKILL.md`;
    console.log(`  ${chalk.green('✔')} ${tool.name.padEnd(16)} ${chalk.dim(relPath)}`);
  }
  console.log(`  ${chalk.green('✔')} Config              ${chalk.dim(`specreview/${CONFIG_YAML}`)}`);
  console.log(`  ${chalk.green('✔')} Check files          ${chalk.dim('specreview/config/')}`);

  console.log();
  console.log(`  ${chalk.bold('Getting started:')}`);
  console.log(`    /specreview <spec-name>     Run a multi-role review`);
  console.log(`    /specreview change-table    Review the "change-table" spec`);
  console.log();
  console.log(`  ${chalk.dim('Restart your AI assistant for the slash command to take effect.')}`);
  console.log();
}
