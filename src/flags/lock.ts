import * as z from '../../deps/zod.ts';

import { buildFlags, zFlagValue } from './common.ts';

export const lock = {
  lock: zFlagValue,
  lockWrite: zFlagValue,
};

const lockSchema = z.object(lock).strict();

export const lockTransformer = (flags: z.infer<typeof lockSchema>) =>
  buildFlags(flags, [
    'lock',
    'lockWrite',
  ]);
