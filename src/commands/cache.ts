import * as z from '../../deps/zod.ts';

import { cli, CliDefinition } from '../deno-cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { lock, lockTransformer } from '../flags/lock.ts';

// TODO(danilo-valente): check flag support mapping
export const cacheFlags = z.object({
  ...compilation,
  ...lock,
}).strict();

const cacheCliFlags = cacheFlags.transform((flags) => [
  ...lockTransformer(flags),
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const cacheCli = cli('cache');

export default {
  flags: cacheFlags,
  build(flags) {
    return cacheCli(cacheCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof cacheFlags>>;
