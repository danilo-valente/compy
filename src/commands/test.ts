import * as z from 'zod/mod.ts';

import { cli, CliDefinition } from '../cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { lock, lockTransformer } from '../flags/lock.ts';
import { runtime, runtimeTransformer } from '../flags/runtime.ts';
import { watch, watchTransformer } from '../flags/watch.ts';

// TODO(danilo-valente): check flag support mapping
export const testFlags = watch
  .merge(lock)
  .merge(compilation)
  .merge(runtime);

const testCliFlags = testFlags.transform((flags) => [
  ...watchTransformer(flags),
  ...lockTransformer(flags),
  ...compilationTransformer(flags),
  ...runtimeTransformer(flags),
]).pipe(z.array(z.string()));

const testCli = cli('test');

export default {
  flags: testFlags,
  build(configPath, flags) {
    return testCli(configPath, testCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof testFlags>>;
