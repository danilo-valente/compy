import { expandGlob } from 'std/fs/expand_glob.ts';
import { dirname } from 'std/path/dirname.ts';
import { normalizeGlob } from 'std/path/glob.ts';
import { toFileUrl } from 'std/path/to_file_url.ts';
import * as z from 'zod/mod.ts';

import { zEmbryo, zEntry } from '~/embryo.ts';
import { allFlags } from '~/flags/all.ts';

import { cacheFlags } from '~/commands/cache.ts';
import { fmtFlags } from '~/commands/fmt.ts';
import { lintFlags } from '~/commands/lint.ts';
import { runFlags } from '~/commands/run.ts';
import { testFlags } from '~/commands/test.ts';
import { basename } from 'std/path/basename.ts';

export const EGG_GLOB = '.compy.egg.@(ts|json)';

export const zEggConfig = z.object({
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
})
  .partial()
  .merge(allFlags)
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

export type EggConfig = z.infer<typeof zEggConfig>;

export type Egg = {
  cwd: string;
  nest: string;
  config: EggConfig;
  name: string;
};

// export const zEggShell = z.union([
//   zEgg,
//   z.object({ default: zEgg }).transform((shell) => shell.default),
// ]);

type EggLoaderArgs = {
  cwd: string;
  glob?: string;
};

export class EggLoader {
  private readonly cwd: string;
  private readonly glob: string;

  constructor({ cwd, rootDir, glob = EGG_GLOB }: EggLoaderArgs) {
    this.cwd = cwd;
    this.glob = glob;
  }

  async load(name: string): Promise<Egg> {
    const eggs = await this.lookup(name);
    const eggUrl = eggs[name];

    if (!eggUrl) {
      throw new Deno.errors.NotFound(`Could not find egg "${name}/${this.glob}" in ${this.cwd} using glob`);
    }

    const eggModule = await import(eggUrl.href);

    const eggConfig = zEggConfig.parse(eggModule.default ?? eggModule);

    return {
      cwd: this.cwd,
      nest: dirname(eggUrl.pathname),
      config: eggConfig,
      name,
    };
  }

  async lookup(pattern = '*'): Promise<Record<string, URL>> {
    const glob = normalizeGlob(`${pattern}/${this.glob}`);

    const urls: Record<string, URL> = {};

    for await (const entry of expandGlob(glob, { root: this.cwd })) {
      if (!entry.isFile) {
        continue;
      }

      const name = basename(dirname(entry.path));

      urls[name] = toFileUrl(entry.path);
    }

    return urls;
  }
}
