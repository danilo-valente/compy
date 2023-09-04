import * as z from 'zod/mod.ts';

import { zEmbryo, zEntry } from './embryo.ts';
import { allFlags } from './engine.ts';

import { cacheFlags } from './commands/cache.ts';
import { fmtFlags } from './commands/fmt.ts';
import { lintFlags } from './commands/lint.ts';
import { runFlags } from './commands/run.ts';
import { testFlags } from './commands/test.ts';

export const zEgg = z.object({
  entry: zEntry,
  cache: zEmbryo(cacheFlags),
  test: zEmbryo(testFlags),
  fmt: zEmbryo(fmtFlags),
  lint: zEmbryo(lintFlags),
  start: zEmbryo(runFlags),
  dev: zEmbryo(runFlags),
  // dev: zEmbryo(runFlags.extend({
  //   watch: runFlags.shape.watch.default(true),
  // })),
  run: z.record(zEmbryo(runFlags)),
  ext: z.record(zEmbryo(allFlags)),
}).partial().merge(allFlags);

export type Egg = z.input<typeof zEgg>;

export const zEggShell = z.union([
  zEgg,
  z.object({ default: zEgg }).transform((shell) => shell.default),
])
  .transform(({ entry, cache, test, fmt, lint, start, dev, run, ext, ...flags }) => ({
    entry,
    cache,
    test,
    fmt,
    lint,
    start,
    dev,
    run,
    ext,
    flags,
  }));

export const zCompy = z.object({
  modules: z.string().default('packages'),
  config: z.string().default('deno.json'),
})
  .partial()
  .pipe(z.object({
    modules: z.string(),
    config: z.string(),
  }));

export type Compy = z.infer<typeof zCompy>;

export const zCompyShell = z.object({
  default: zCompy,
}).transform((shell) => shell.default).or(zCompy);
