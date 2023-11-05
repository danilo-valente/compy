import * as z from '../../deps/zod.ts';

import { cli, CliDefinition } from '../deno-cli.ts';
import { compilation, compilationTransformer } from '../flags/compilation.ts';
import { watch, watchTransformer } from '../flags/watch.ts';

// TODO(danilo-valente): check flag support mapping
export const fmtFlags = z.object({
  ...compilation,
  ...watch,
});

const fmtCliFlags = fmtFlags.transform((flags) => [
  ...watchTransformer(flags),
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const fmtCli = cli('fmt');

export default {
  flags: fmtFlags,
  build(configPath, flags) {
    return fmtCli(configPath, fmtCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof fmtFlags>>;
