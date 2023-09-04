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

export const EGG_GLOB = '.compy.egg.@(ts|json)';

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

export type Egg = z.infer<typeof zEgg>;

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

  constructor({ cwd, glob = EGG_GLOB }: EggLoaderArgs) {
    this.cwd = cwd;
    this.glob = glob;
  }

  async load(name: string): Promise<[string, Egg]> {
    const [eggUrl] = await this.lookup(name);

    if (!eggUrl) {
      throw new Deno.errors.NotFound(`Could not find ${this.glob} in ${this.cwd}`);
    }

    return await this.loadFromUrl(eggUrl);
  }

  async loadFromUrl(eggUrl: URL): Promise<[string, Egg]> {
    const eggModule = await import(eggUrl.href);

    const egg = zEgg.parse(eggModule.default ?? eggModule);

    return [dirname(eggUrl.pathname), egg];
  }

  async lookup(name = '*'): Promise<URL[]> {
    const glob = normalizeGlob(`${name}/${this.glob}`);

    const urls = [];

    for await (const entry of expandGlob(glob, { root: this.cwd })) {
      if (!entry.isFile) {
        continue;
      }

      urls.push(
        toFileUrl(entry.path),
      );
    }

    return urls;
  }
}
