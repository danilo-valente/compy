import * as z from '../../deps/zod.ts';

export const lock = {
  lock: z.string().optional(),
  lockWrite: z.boolean().optional(),
};

const lockSchema = z.object(lock).strict();

export const lockTransformer = (flags: z.infer<typeof lockSchema>) =>
  [
    flags.lock ? `--lock=${flags.lock}` : undefined,
    flags.lockWrite ? '--lock-write' : undefined,
  ].filter(Boolean);
