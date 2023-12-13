import * as z from '../../deps/zod.ts';

import { buildUnstable, zUnstableFlags } from '../unstable.ts';
import { buildFlags, zFlagValue } from './common.ts';

export const compilation = {
  config: z.string().optional(),
  importMap: z.string().optional(),
  noRemote: z.boolean().optional(),
  reload: zFlagValue,
  unstable: z.union([
    zUnstableFlags.optional(),
    z.literal(false).transform(() => []),
    z.literal(true).optional(),
  ]).optional(),
};

const compilationSchema = z.object(compilation).strict();

export const compilationTransformer = ({ unstable, ...flags }: z.infer<typeof compilationSchema>) => [
  ...unstable === true ? ['--unstable'] : buildUnstable(unstable ?? []),
  ...buildFlags(flags, [
    'config',
    'importMap',
    'noRemote',
    'reload',
  ]),
];
