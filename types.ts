import * as z from 'zod/mod.ts';

import { zCompy } from './src/compy.ts';
import { zEgg } from './src/egg.ts';

export type Egg = z.input<typeof zEgg>;

export type Compy = z.input<typeof zCompy>;
