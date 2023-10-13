import { EnumType, StringType } from 'cliffy/command/mod.ts';

import { Compy, CompyLoader } from '~/compy.ts';
import { Cmd } from '~/monorepo.ts';

let compy: Compy;

export const getCompy = async (): Promise<Compy> => {
  if (!compy) {
    compy = await CompyLoader.from(Deno.cwd());
  }

  return compy;
};

export const getEggs = async (): Promise<string[]> => {
  const compy = await getCompy();
  const eggs = await compy.eggs.lookup();

  return Object.keys(eggs);
};

export class EggType extends StringType {
  async complete() {
    try {
      return await getEggs();
    } catch {
      return [];
    }
  }
}

export class CmdType extends EnumType<Cmd> {
  constructor() {
    super(['cache', 'fmt', 'lint', 'test', 'start', 'dev']);
  }
}

export const fetchModuleVersion = async (module: string) => {
  const response = await fetch(`https://apiland.deno.dev/v2/modules/${module}`);

  const { latest_version } = await response.json();

  return latest_version;
};
