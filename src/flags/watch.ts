import * as z from '../../deps/zod.ts';

import { buildFlags, zFlagValue } from './common.ts';

export const watch = {
  watch: zFlagValue,
};

const watchSchema = z.object(watch).strict();

export const watchTransformer = (flags: z.infer<typeof watchSchema>) =>
  buildFlags(flags, [
    'watch',
  ]);
