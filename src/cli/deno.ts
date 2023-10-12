import { Command } from 'cliffy/command/mod.ts';

import { buildNative, Cmd, runNative } from '~/monorepo.ts';
import { EggType, getCompy } from './util.ts';

const buildCommand = (cmd: Cmd) =>
  new Command()
    .name(cmd)
    .type('egg', new EggType())
    .arguments('<module:egg>')
    .useRawArgs()
    .action(async (_options, module, ...args) => {
      const compy = await getCompy();
      const native = await buildNative(compy, cmd, module, args);

      const code = await runNative(native);

      Deno.exit(code);
    });

export const cache = buildCommand('cache');
export const fmt = buildCommand('fmt');
export const lint = buildCommand('lint');
export const test = buildCommand('test');
export const start = buildCommand('start');
export const dev = buildCommand('dev');
