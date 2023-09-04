import * as z from 'zod/mod.ts';

export const watch = z.object({
  watch: z.boolean().optional(),
}).strict();

export const watchTransformer = (flags: z.infer<typeof watch>) =>
  [
    flags.watch ? '--watch' : undefined,
  ].filter(Boolean);
