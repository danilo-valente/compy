import { Command, EnumType } from '../../deps/cliffy.ts';

import { buildNative, Cmd, exportNative, runNative, ShellCommand } from '../monorepo.ts';
import { EggType, getCompy } from './util.ts';

const shellType = new EnumType(['sh', 'bash', 'zsh', 'ash', 'fish']);

const runOrExport = async (native: ShellCommand, shell?: string) => {
  if (shell) {
    const script = await exportNative(native, shell);

    await Deno.stdout.write(
      new TextEncoder().encode(script),
    );

    return 0;
  }

  return await runNative(native);
};

const buildCommand = (cmd: Cmd, description: string) =>
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
      const native = await buildNative(compy, [cmd], module, args);

      return await runOrExport(native, shell);
    });

export const cache = buildCommand('cache', 'Run \'deno cache\' on a module');
export const fmt = buildCommand('fmt', 'Run \'deno fmt\' on a module');
export const lint = buildCommand('lint', 'Run \'deno lint\' on a module');
export const test = buildCommand('test', 'Run \'deno test\' on a module');
export const start = buildCommand('start', 'Run \'deno run\' on a module with \'start\' config');
export const dev = buildCommand('dev', 'Run \'deno run\' on a module with \'dev\' config');

export const run = new Command()
  .name('run')
  .description('Run \'deno run\' on a module')
  .type('egg', new EggType())
  .type('shell', shellType)
  .arguments('<module:egg> <task:string> [...args:string]')
  .option('-e, --shell <shell:shell>', 'Export command as a shell script')
  .stopEarly()
  .action(async ({ shell }, module, task, ...args) => {
    const compy = await getCompy();
    const native = await buildNative(compy, ['run', task], module, args);

    return await runOrExport(native, shell);
  });
