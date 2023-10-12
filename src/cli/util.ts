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

export class EggType extends StringType {
  async complete() {
    try {
      const compy = await getCompy();
      const eggs = await compy.eggs.lookup();
      return Object.keys(eggs);
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
