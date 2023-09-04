import * as z from 'zod/mod.ts';

import { cli, CliDefinition } from '../cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { watch, watchTransformer } from '../flags/watch.ts';
import { lock, lockTransformer } from '../flags/lock.ts';
import { runtime, runtimeTransformer } from '../flags/runtime.ts';

// TODO(danilo-valente): check flag support mapping
export const runFlags = watch
  .merge(lock)
  .merge(compilation)
  .merge(runtime);

const runCliFlags = runFlags.transform((flags) => [
  ...watchTransformer(flags),
  ...lockTransformer(flags),
  ...compilationTransformer(flags),
  ...runtimeTransformer(flags),
]).pipe(z.array(z.string()));

const runCli = cli('run');

export default {
  flags: runFlags,
  build(configPath, flags) {
    return runCli(configPath, runCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof runFlags>>;
