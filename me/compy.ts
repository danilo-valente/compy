import { CompyLoader } from '../src/compy.ts';
import { buildNative, CompyCmd, runNative, RunNativeOptions } from '../src/monorepo.ts';
export { buildLogger } from '../src/monorepo.ts';

const compy = await CompyLoader.from(Deno.cwd());

export default compy;

type KitCommand = (eggName: string, argv?: string[]) => Promise<Deno.CommandStatus>;

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
  const bind = (cmd: CompyCmd) => async (eggName: string, argv?: string[]) => {
    const egg = await compy.eggs.mapAndLoad(eggName);
    const native = buildNative(compy, egg, cmd, argv);
    return runNative(native, options);
  };

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

export const {
  cache,
  fmt,
  lint,
  test,
  start,
  dev,
} = kit();
