import { red } from 'std/fmt/colors.ts';
import { ZodError } from 'zod/mod.ts';
import { generateErrorMessage } from 'npm:zod-error';

import compy, { Cmd } from './mod.ts';

const [cmd, eggName, ...argv] = Deno.args;

try {
  // FIXME(danilo-valente): provide proper type check
  const command = await compy(cmd as Cmd, eggName, argv);

  const code = await command();

  Deno.exit(code);
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
    console.error(error);
  }

  Deno.exit(1);
}
