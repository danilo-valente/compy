import * as z from 'zod/mod.ts';

import { cli, CliDefinition } from '~/cli.ts';
import { compilation, compilationTransformer } from '~/flags/compilation.ts';
import { lock, lockTransformer } from '~/flags/lock.ts';

// TODO(danilo-valente): check flag support mapping
export const checkflags = z.object({})
  .merge(compilation)
  .merge(lock);

const checkCliFlags = checkflags.transform((flags) => [
  ...lockTransformer(flags),
  ...compilationTransformer(flags),
]).pipe(z.array(z.string()));

const checkCli = cli('check');

export default {
  flags: checkflags,
  build(configPath, flags) {
    return checkCli(configPath, checkCliFlags.parse(flags));
  },
} satisfies CliDefinition<z.infer<typeof checkflags>>;
