import * as z from '../../deps/zod.ts';

export const watch = {
  watch: z.boolean().optional(),
};

const watchSchema = z.object(watch).strict();

export const watchTransformer = (flags: z.infer<typeof watchSchema>) =>
  [
    flags.watch ? '--watch' : undefined,
  ].filter(Boolean);
