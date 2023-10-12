import { Command, StringType } from 'cliffy/command/mod.ts';

import { buildShell, Cmd, runShell } from '~/monorepo.ts';
import { CompyLoader } from '~/compy.ts';

let eggs: Record<string, URL>;

const getEggs = async () => {
  if (!eggs) {
    const compy = await CompyLoader.from(Deno.cwd());
    eggs = await compy.eggs.lookup();
  }

  return eggs;
};

class EggType extends StringType {
  async complete() {
    return Object.keys(await getEggs());
  }
}

const buildCommand = (cmd: Cmd) =>
  new Command()
    .name(cmd)
    .type('egg', new EggType())
    .arguments('<module:egg>')
    .stopEarly()
    .action(async (_options, module, ...args) => {
      const shell = await buildShell(Deno.cwd(), cmd, module, args);

      const code = await runShell(shell);

      Deno.exit(code);
    });

export const cache = buildCommand('cache');
export const fmt = buildCommand('fmt');
export const lint = buildCommand('lint');
export const test = buildCommand('test');
export const start = buildCommand('start');
export const dev = buildCommand('dev');
