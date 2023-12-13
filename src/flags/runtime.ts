import * as z from '../../deps/zod.ts';

import { buildPermissions, permissionFlags } from '../permissions.ts';
import { buildFlags, zFlagValue } from './common.ts';

export const runtimeInspect = z.union([
  z.string(),
  z.tuple([z.string(), z.number()]).transform(([host, port]) => `${host}:${port}`),
]);

export const runtime = {
  allow: z.union([
    permissionFlags.optional(),
    z.literal(true).optional(),
  ]).optional(),
  deny: permissionFlags.optional(),
  check: zFlagValue,
  inspect: runtimeInspect.optional(),
  inspectBrk: runtimeInspect.optional(),
  inspectWait: runtimeInspect.optional(),
  location: z.string().optional(),
  prompt: z.boolean().optional(),
  seed: z.number().optional(),
  v8Flags: z.string().optional(),
};

const runtimeSchema = z.object(runtime).strict();

export const runtimeTransformer = ({ allow, deny, ...flags }: z.infer<typeof runtimeSchema>) => [
  ...allow === true ? ['-A'] : buildPermissions(allow ?? [], 'allow'),
  ...buildPermissions(deny ?? [], 'deny'),
  ...buildFlags(flags, [
    'check',
    'inspect',
    'inspectBrk',
    'inspectWait',
    'location',
    'prompt',
    'seed',
    'v8Flags',
  ]),
];
