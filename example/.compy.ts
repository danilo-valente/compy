import { Compy } from '../types.ts';

export default {
  name: 'my-project',
  modules: 'packages',
  config: 'deno.@(jsonc|json)',
  aliasFn(module: string) {
    return `@${this.name}/${module}/`;
  },
} satisfies Compy;
