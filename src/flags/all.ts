import * as z from '../../deps/zod.ts';

import { compilation } from './compilation.ts';
import { lock } from './lock.ts';
import { runtime } from './runtime.ts';
import { watch } from './watch.ts';

export const allFlags = z.object({
  ...compilation,
  ...lock,
  ...runtime,
  ...watch,
});

export type AllFlagsInput = z.input<typeof allFlags>;
