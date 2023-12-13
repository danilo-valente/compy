import { ArgumentValue, EnumType, StringType, Type } from '../../deps/cliffy.ts';

import { Compy, CompyLoader } from '../compy.ts';
import { Cmd } from '../monorepo.ts';

let compy: Compy;

export const getCompy = async (): Promise<Compy> => {
  if (!compy) {
    compy = await CompyLoader.from(Deno.cwd());
  }

  return compy;
};

export const getEggs = async (): Promise<string[]> => {
  const compy = await getCompy();
  const eggs = await compy.eggs.map();

  return Object.keys(eggs);
};

export class UrlType extends Type<URL> {
  parse({ value }: ArgumentValue) {
    return new URL(value);
  }
}

export class EggType extends StringType {
  complete() {
    try {
      return getEggs();
    } catch {
      return Promise.resolve([]);
    }
  }
}

export class CmdType extends EnumType<Cmd> {
  constructor() {
    super(['cache', 'fmt', 'lint', 'test', 'start', 'dev']);
  }
}

export const fetchModuleVersion = async (module: string) => {
  // TODO(danilo-valente): parameterize registry API URL
  const response = await fetch(`https://apiland.deno.dev/v2/modules/${module.replace(/\/+$/, '')}`);

  const { latest_version } = await response.json();

  return latest_version;
};

type BuildDenoLandUrlArgs = {
  name: string;
  maybeVersion?: string;
  maybeUrl?: URL;
};

export const buildDenoLandUrl = async ({ name, maybeVersion, maybeUrl }: BuildDenoLandUrlArgs): Promise<URL> => {
  if (maybeUrl) {
    if (maybeVersion) {
      console.warn('Warning: version argument will be ignored in favor of URL');
    }

    return maybeUrl;
  }

  // TODO(danilo-valente): parameterize registry URL / add support for other registries
  const REGISTRY = 'https://deno.land/';

  const prefix = name === 'std' ? '' : 'x/';
  const suffix = name.endsWith('/') ? '/' : '';

  // TODO(danilo-valente): handle names that are already in format name@version
  const version = maybeVersion || await fetchModuleVersion(name);
  if (version) {
    return new URL(`${prefix}${name}@${version}${suffix}`, REGISTRY);
  }

  console.warn('Warning: could not find latest version for module. Falling back to latest');
  return new URL(`${prefix}${name}${suffix}`, REGISTRY);
};
