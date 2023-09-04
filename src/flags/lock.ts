import * as z from 'zod/mod.ts';

export const lock = z.object({
  lock: z.string().optional(),
  lockWrite: z.boolean().optional(),
}).strict();

export const lockTransformer = (flags: z.infer<typeof lock>) =>
  [
    flags.lock ? `--lock=${flags.lock}` : undefined,
    flags.lockWrite ? '--lock-write' : undefined,
  ].filter(Boolean);
