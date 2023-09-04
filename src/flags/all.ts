import * as z from 'zod/mod.ts';

import { compilation } from './compilation.ts';
import { lock } from './lock.ts';
import { runtime } from './runtime.ts';
import { watch } from './watch.ts';

export const allFlags = lock
  .merge(watch)
  .merge(compilation)
  .merge(runtime);

export type AllFlags = z.infer<typeof allFlags>;
