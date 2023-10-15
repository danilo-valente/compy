import * as z from 'zod/mod.ts';

export const watch = {
  watch: z.boolean().optional(),
};

const watchSchema = z.object(watch).strict();

export const watchTransformer = (flags: z.infer<typeof watchSchema>) =>
  [
    flags.watch ? '--watch' : undefined,
  ].filter(Boolean);
