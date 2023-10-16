import { expandGlob } from 'std/fs/expand_glob.ts';
import { resolve } from 'std/path/resolve.ts';
import * as jsonc from 'std/jsonc/mod.ts';

// TODO(danilo-valente): map all deno.config attributes
export type DenoConfig = {
  importMap: string;
};

export type DenoConfigContext = {
  path: string;
  config: DenoConfig;
};

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

  async load(dir = this.cwd): Promise<DenoConfigContext | null> {
    const path = await this.lookup(dir);

    if (!path) {
      return null;
    }

    // TODO(danilo-valente): validate config
    const config = jsonc.parse(
      await Deno.readTextFile(path),
    ) as DenoConfig;

    return {
      path,
      config: {
        importMap: config.importMap ?? 'import_map.json',
      },
    };
  }
}
