import * as z from '../../deps/zod.ts';

import { cli, CliDefinition } from '../deno-cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';

// TODO(danilo-valente): check flag support mapping
export const lintFlags = z.object({
  ...compilation,
});

const lintCliFlags = lintFlags.transform((flags) => [
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const lintCli = cli('lint');

export default {
  flags: lintFlags,
  build(flags) {
    return lintCli(lintCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof lintFlags>>;
