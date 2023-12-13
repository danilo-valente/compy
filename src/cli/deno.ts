import { Command, EnumType } from '../../deps/cliffy.ts';

import { Cmd, exportNative, loadNative, runNative, ShellCommand } from '../monorepo.ts';
import { EggType, getCompy, getEggs } from './util.ts';

const shellType = new EnumType(['sh', 'bash', 'zsh', 'ash', 'fish']);

const runOrExport = async (native: ShellCommand, shell?: string): Promise<Deno.CommandStatus> => {
  if (shell) {
    const script = await exportNative(native, shell);

    await Deno.stdout.write(
      new TextEncoder().encode(script),
    );

    return {
      success: true,
      code: 0,
      signal: null,
    };
  }

  return runNative(native);
};

const buildCommand = (cmd: Cmd, description: string) =>
  new Command()
    .name(cmd)
    .description(description)
    .type('egg', new EggType())
    .type('shell', shellType)
    .arguments('[module:egg] [...args:string]')
    .option('-e, --shell <shell:shell>', 'Export command as a shell script')
    .stopEarly()
    .action(async ({ shell }, module, ...args): Promise<Deno.CommandStatus> => {
      const compy = await getCompy();

      const runOrExportModule = async (moduleName: string) => {
        const native = await loadNative(compy, [cmd], moduleName, args);

        return runOrExport(native, shell);
      };

      if (module) {
        return runOrExportModule(module);
      }

      const modules = await getEggs();

      for (const module of modules) {
        const status = await runOrExportModule(module);
        if (!status.success) {
          return status;
        }
      }

      return {
        success: true,
        code: 0,
        signal: null,
      };
    });

const buildModuleCommand = (cmd: Cmd, description: string) =>
  new Command()
    .name(cmd)
    .description(description)
    .type('egg', new EggType())
    .type('shell', shellType)
    .arguments('<module:egg> [...args:string]')
    .option('-e, --shell <shell:shell>', 'Export command as a shell script')
    .stopEarly()
    .action(async ({ shell }, module, ...args) => {
      const compy = await getCompy();

      const native = await loadNative(compy, [cmd], module, args);

      return await runOrExport(native, shell);
    });

export const cache = buildCommand('cache', `Run 'deno cache' on a module`);
export const fmt = buildCommand('fmt', `Run 'deno fmt' on a module`);
export const lint = buildCommand('lint', `Run 'deno lint' on a module`);
export const test = buildCommand('test', `Run 'deno test' on a module`);

export const start = buildModuleCommand('start', `Run 'deno run' on a module with 'start' config`);
export const dev = buildModuleCommand('dev', `Run 'deno run' on a module with 'dev' config`);

export const run = new Command()
  .name('run')
  .description(`Run 'deno run' on a module`)
  .type('egg', new EggType())
  .type('shell', shellType)
  .arguments('<module:egg> <task:string> [...args:string]')
  .option('-e, --shell <shell:shell>', 'Export command as a shell script')
  .stopEarly()
  .action(async ({ shell }, module, task, ...args) => {
    const compy = await getCompy();
    const native = await loadNative(compy, ['run', task], module, args);

    return await runOrExport(native, shell);
  });
