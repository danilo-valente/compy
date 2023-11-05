import * as z from '../deps/zod.ts';

import { AllFlags } from './flags/all.ts';

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
