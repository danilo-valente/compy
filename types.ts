import * as z from 'zod/mod.ts';

import { zCompy, zEgg } from './src/schema.ts';

export type Egg = z.input<typeof zEgg>;

export type Compy = z.input<typeof zCompy>;
