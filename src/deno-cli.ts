import * as z from '../deps/zod.ts';

import { AllFlagsInput } from './flags/all.ts';

export const cli = (command: string) => (flags: string[]): CliCommand => {
  return {
    command: Deno.execPath(),
    args: [
      command,
      ...flags,
    ],
  };
};

export interface CliDefinition<F extends AllFlagsInput> {
  readonly flags: z.ZodType<F>;
  build(flags: F): CliCommand;
}

export interface CliCommand {
  command: string;
  args: string[];
}
