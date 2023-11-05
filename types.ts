import * as z from './deps/zod.ts';

import { zCompyConfig } from './src/compy.ts';
import { zEggConfig } from './src/egg.ts';

export type Egg = z.input<typeof zEggConfig>;

export type Compy = z.input<typeof zCompyConfig>;
