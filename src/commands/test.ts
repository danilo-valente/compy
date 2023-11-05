import * as z from '../../deps/zod.ts';

import { cli, CliDefinition } from '../deno-cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { lock, lockTransformer } from '../flags/lock.ts';
import { runtime, runtimeTransformer } from '../flags/runtime.ts';
import { watch, watchTransformer } from '../flags/watch.ts';

// TODO(danilo-valente): check flag support mapping
export const testFlags = z.object({
  ...compilation,
  ...watch,
  ...lock,
  ...runtime,
}).strict();

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
