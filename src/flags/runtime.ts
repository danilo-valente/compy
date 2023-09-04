import * as z from 'zod/mod.ts';

import { buildPermissions, permissionFlags } from '../permissions.ts';

export const runtimeInspect = z.union([z.string(), z.tuple([z.string(), z.number()])]);

export const runtime = z.object({
  allow: z.union([
    permissionFlags.optional(),
    z.literal(true).optional(),
  ]).optional(),
  deny: permissionFlags.optional(),
  check: z.boolean().optional(),
  inspect: runtimeInspect.optional(),
  inspectBrk: runtimeInspect.optional(),
  inspectWait: runtimeInspect.optional(),
  location: z.string().optional(),
  prompt: z.boolean().optional(),
  seed: z.number().optional(),
  v8Flags: z.string().optional(),
}).strict();

export const runtimeTransformer = (flags: z.infer<typeof runtime>) =>
  [
    ...flags.allow === true ? ['-A'] : buildPermissions(flags.allow ?? [], 'allow'),
    ...buildPermissions(flags.deny ?? [], 'deny'),
    flags.check ? '--check' : undefined,
    flags.inspect ? `--inspect=${flags.inspect}` : undefined,
    flags.inspectBrk ? `--inspect-brk=${flags.inspectBrk}` : undefined,
    flags.inspectWait ? `--inspect-wait=${flags.inspectWait}` : undefined,
    flags.location ? `--location=${flags.location}` : undefined,
    flags.prompt ? '--prompt' : undefined,
    flags.seed ? `--seed=${flags.seed}` : undefined,
    flags.v8Flags ? `--v8-flags=${flags.v8Flags}` : undefined,
  ].filter(Boolean);
