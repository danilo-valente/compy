import { assert } from '../deps/std.ts';

import { CompyLoader } from '../src/compy.ts';
import { buildNative, CompyCmd, runNative, RunNativeOptions } from '../src/monorepo.ts';
export { buildLogger } from '../src/monorepo.ts';

export const compy = await CompyLoader.from(Deno.cwd());

const eggPath = await compy.eggs.lookup(compy.cwd);
assert(eggPath, 'Not in a nest');

export const egg = await compy.eggs.load(eggPath);

const build = buildNative.bind(null, compy, egg);

type KitCommand = (argv?: string[]) => Promise<Deno.CommandStatus>;

type Kit = Record<string, KitCommand> & {
  cache: KitCommand;
  fmt: KitCommand;
  lint: KitCommand;
  test: KitCommand;
  start: KitCommand;
  dev: KitCommand;
  // run: (script: string, argv?: string[]) => Promise<Deno.CommandStatus>;
};

export const kit = (options: RunNativeOptions = { log: false }): Kit => {
  const bind = (cmd: CompyCmd) => (argv?: string[]) => runNative(build(cmd, argv), options);

  const base: Kit = {
    cache: bind(['cache']),
    fmt: bind(['fmt']),
    lint: bind(['lint']),
    test: bind(['test']),
    start: bind(['start']),
    dev: bind(['dev']),
    // run: (script: string, argv?: string[]) => buildAndRun(['run', script], argv),
  };

  return new Proxy(base, {
    get: (target, prop, receiver) => {
      if (Reflect.has(target, prop)) {
        return Reflect.get(target, prop, receiver);
      }

      return bind(['run', prop.toString()]);
    },
  });
};

const stdKit = kit();
export default stdKit;

export const {
  cache,
  fmt,
  lint,
  test,
  start,
  dev,
} = stdKit;
