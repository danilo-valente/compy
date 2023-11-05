import { red } from './deps/std.ts';
import { generateErrorMessage, ZodError } from './deps/zod.ts';

import cli from './src/cli/mod.ts';

try {
  const code = await cli.parse(Deno.args);

  if (typeof code === 'number' && code !== 0) {
    Deno.exit(code);
  }
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
    console.error(red(error.message));
  } else if (error instanceof Deno.errors.NotFound) {
    console.error(red(error.message));
  } else {
    console.error(red(error.stack || error.message));
  }

  Deno.exit(1);
}
