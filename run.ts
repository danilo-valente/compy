import { red } from 'std/fmt/colors.ts';
import { sprintf } from 'std/fmt/printf.ts';
import { ZodError } from 'zod/mod.ts';

import compy, { Cmd } from './mod.ts';

const [cmd, eggName, ...argv] = Deno.args;

try {
  // FIXME(danilo-valente): provide proper type check
  await compy(cmd as Cmd, eggName, argv);
} catch (error) {
  if (error instanceof ZodError) {
    console.error(red(sprintf('%i\n%s', error.format(), error.stack)));
  } else if (error instanceof Deno.errors.InvalidData) {
    console.error(error.message);
  } else if (error instanceof Deno.errors.NotFound) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  Deno.exit(1);
}
