import { expandGlob } from 'std/fs/expand_glob.ts';
import { resolve } from 'std/path/resolve.ts';

type ConfigLoaderArgs = {
  cwd?: string;
  rootDir?: string;
  glob: string;
};

export class ConfigLoader {
  private readonly cwd: string;
  private readonly rootDir: string;
  private readonly glob: string;

  constructor({ cwd = Deno.cwd(), rootDir = resolve('/'), glob }: ConfigLoaderArgs) {
    this.cwd = cwd;
    this.rootDir = rootDir;
    this.glob = glob;
  }

  async lookup(dir = this.cwd): Promise<string | null> {
    for await (const entry of expandGlob(this.glob, { root: dir })) {
      if (!entry.isFile) {
        continue;
      }

      return entry.path;
    }

    if (dir === this.rootDir) {
      return null;
    }

    return this.lookup(resolve(dir, '..'));
  }
}
