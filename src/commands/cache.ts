import * as z from 'zod/mod.ts';

import { cli, CliDefinition } from '../cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { lock, lockTransformer } from '../flags/lock.ts';

// TODO(danilo-valente): check flag support mapping
export const cacheFlags = z.object({})
  .merge(compilation)
  .merge(lock);

const cacheCliFlags = cacheFlags.transform((flags) => [
  ...lockTransformer(flags),
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const cacheCli = cli('cache');

export default {
  flags: cacheFlags,
  build(configPath, flags) {
    return cacheCli(configPath, cacheCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof cacheFlags>>;
