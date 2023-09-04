import { zodToJsonSchema } from 'npm:zod-to-json-schema';

import { zCompy } from './src/compy.ts';
import { zEgg } from './src/egg.ts';

await Promise.all([
  Deno.writeTextFile('./compy.schema.json', JSON.stringify(zodToJsonSchema(zCompy, 'compy'), null, 2)),
  Deno.writeTextFile('./egg.schema.json', JSON.stringify(zodToJsonSchema(zEgg, 'egg'), null, 2)),
]);
