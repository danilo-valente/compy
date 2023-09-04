import { Compy } from '../types.ts';

export default {
  modules: 'packages',
  config: 'deno.@(jsonc|json)',
} satisfies Compy;
