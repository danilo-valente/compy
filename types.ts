import * as z from 'zod/mod.ts';

import { zCompyConfig } from '~/compy.ts';
import { zEggConfig } from '~/egg.ts';

export type Egg = z.input<typeof zEggConfig>;

export type Compy = z.input<typeof zCompyConfig>;
