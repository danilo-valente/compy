import * as z from 'zod/mod.ts';

import { cli, CliDefinition } from '../cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';

// TODO(danilo-valente): check flag support mapping
export const lintFlags = z.object({})
  .merge(compilation);

const lintCliFlags = lintFlags.transform((flags) => [
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const lintCli = cli('lint');

export default {
  flags: lintFlags,
  build(configPath, flags) {
    return lintCli(configPath, lintCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof lintFlags>>;
