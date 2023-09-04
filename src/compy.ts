import { expandGlob } from 'std/fs/expand_glob.ts';
import { dirname } from 'std/path/dirname.ts';
import { resolve } from 'std/path/resolve.ts';
import { toFileUrl } from 'std/path/to_file_url.ts';
import * as z from 'zod/mod.ts';

export const COMPY_GLOB = '.compy.@(ts|json)';

export const zCompy = z.object({
  modules: z.string().default('packages'),
  config: z.string().default('deno.@(jsonc|json)'),
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

type CompyLoaderArgs = {
  cwd?: string;
  rootDir?: string;
  glob?: string;
};

export class CompyLoader {
  private readonly cwd: string;
  private readonly rootDir: string;
  private readonly glob: string;

  constructor({ cwd = Deno.cwd(), rootDir = resolve('/'), glob = COMPY_GLOB }: CompyLoaderArgs = {}) {
    this.cwd = cwd;
    this.rootDir = rootDir;
    this.glob = glob;
  }

  async load(): Promise<[string, Compy]> {
    const compyUrl = await this.lookup();

    if (!compyUrl) {
      throw new Deno.errors.NotFound(
        `Not a Compy project: could not find ${this.glob} in current working dir or in any parent directory`,
      );
    }

    const compy = zCompyShell.parse(
      await import(compyUrl.href),
    );

    return [dirname(compyUrl.pathname), compy];
  }

  async lookup(dir = this.cwd): Promise<URL | null> {
    for await (const entry of expandGlob(this.glob, { root: dir })) {
      if (!entry.isFile) {
        continue;
      }

      return toFileUrl(entry.path);
    }

    if (dir === this.rootDir) {
      return null;
    }

    return this.lookup(resolve(dir, '..'));
  }
}
