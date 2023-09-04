import * as z from 'zod/mod.ts';

import { compilation } from './flags/compilation.ts';
import { lock } from './flags/lock.ts';
import { runtime } from './flags/runtime.ts';
import { watch } from './flags/watch.ts';

export const allFlags = z.object({})
  .merge(lock)
  .merge(watch)
  .merge(compilation)
  .merge(runtime);

export type AllFlags = z.infer<typeof allFlags>;

export const cli = (command: string) => (configPath: string | null, flags: string[]): CliCommand => {
  return {
    command: Deno.execPath(),
    args: [
      command,
      ...configPath ? ['-c', configPath] : [],
      ...flags,
    ],
  };
};

export interface CliDefinition<F extends AllFlags> {
  readonly flags: z.ZodType<F>;
  build(configPath: string | null, flags: F): CliCommand;
}

export interface CliCommand {
  command: string;
  args: string[];
}
