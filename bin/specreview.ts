#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { init } from '../commands/init.js';
import { update } from '../commands/update.js';
import { validateProjectPath } from '../commands/shared.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Works both when running from source (bin/) and compiled (dist/bin/)
const rootDir = resolve(__dirname, __dirname.includes('/dist/') ? '../../' : '../');
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8')) as { version: string };

const program = new Command();

program
  .name('specreview')
  .description('Multi-role code review skill for AI coding assistants')
  .version(pkg.version);

program
  .command('init [directory]')
  .description('Initialize specreview in your project')
  .option(
    '--tools <tools>',
    'Comma-separated tool IDs (claude,cursor,windsurf,...). Omit for interactive selection.',
  )
  .option('--force', 'Overwrite existing files without prompting')
  .action(async (directory = '.', options: { tools?: string; force?: boolean }) => {
    try {
      const cwd = process.cwd();
      const projectPath = resolve(cwd, directory);
      validateProjectPath(projectPath, cwd);

      const tools = options.tools ? options.tools.split(',').map((t) => t.trim().toLowerCase()) : undefined;
      await init({ projectPath, tools, force: options.force ?? false });
    } catch (err) {
      console.error(`\n  Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program
  .command('update [directory]')
  .description('Update specreview npm package + local files (preserves config customizations)')
  .action(async (directory = '.') => {
    try {
      const cwd = process.cwd();
      const projectPath = resolve(cwd, directory);
      validateProjectPath(projectPath, cwd);

      await update({ projectPath });
    } catch (err) {
      console.error(`\n  Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program.parse();
