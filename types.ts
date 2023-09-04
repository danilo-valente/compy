import * as z from 'zod/mod.ts';

import { zCompy } from '~/compy.ts';
import { zEgg } from '~/egg.ts';

export type Egg = z.input<typeof zEgg>;

export type Compy = z.input<typeof zCompy>;
