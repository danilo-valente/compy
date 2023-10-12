import { Command } from 'cliffy/command/mod.ts';

import { buildNative, Cmd, runNative } from '~/monorepo.ts';
import { EggType, getCompy } from './util.ts';

const buildCommand = (cmd: Cmd, description: string) =>
  new Command()
    .name(cmd)
    .description(description)
    .type('egg', new EggType())
    .arguments('<module:egg>')
    .useRawArgs()
    .action(async (_options, module, ...args) => {
      const compy = await getCompy();
      const native = await buildNative(compy, cmd, module, args);

      const code = await runNative(native);

      Deno.exit(code);
    });

export const cache = buildCommand('cache', 'Run \'deno cache\' on a module');
export const fmt = buildCommand('fmt', 'Run \'deno fmt\' on a module');
export const lint = buildCommand('lint', 'Run \'deno lint\' on a module');
export const test = buildCommand('test', 'Run \'deno test\' on a module');
export const start = buildCommand('start', 'Run \'deno run\' on a module with \'start\' config');
export const dev = buildCommand('dev', 'Run \'deno run\' on a module with \'dev\' config');
