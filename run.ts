import { red } from 'std/fmt/colors.ts';
import { ZodError } from 'zod/mod.ts';
import { generateErrorMessage } from 'npm:zod-error';

import compy, { Cmd } from './mod.ts';

const [cmd, eggName, ...argv] = Deno.args;

try {
  // FIXME(danilo-valente): provide proper type check
  await compy(cmd as Cmd, eggName, argv);
} catch (error) {
  if (error instanceof ZodError) {
    const message = generateErrorMessage(error.issues, {
      delimiter: {
        error: '\n',
        component: ' ',
      },
      code: {
        enabled: true,
        transform: ({ value }) => `${value}:`,
      },
      path: {
        enabled: true,
        type: 'objectNotation',
        transform: ({ value }) => `Attribute ${value}`,
      },
      message: {
        enabled: true,
        transform: ({ value }) => value,
      },
    });

    console.error(red(message));
  } else if (error instanceof Deno.errors.InvalidData) {
    console.error(error.message);
  } else if (error instanceof Deno.errors.NotFound) {
    console.error(error.message);
  } else {
    throw error;
  }

  Deno.exit(1);
}
