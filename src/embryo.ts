import * as z from 'zod/mod.ts';

import { allFlags } from '~/flags/all.ts';

export const zEntry = z.string().min(1);

const zEmbryoObject = <F extends z.AnyZodObject>(flags: F) =>
  z.object({
    entry: zEntry,
    args: z.array(z.string()),
    env: z.record(z.string()),
  })
    .partial()
    .merge(flags)
    .transform(({ entry, args, env, ...flags }) => ({
      flags,
      entry,
      args,
      env,
    }));

const zEmbryoEntry = <F extends z.AnyZodObject>(flags: F) =>
  zEntry.transform((entry) => ({ entry }))
    .pipe(zEmbryoObject(flags));

export const zEmbryo = <F extends z.AnyZodObject>(flags: F) =>
  z.union([
    zEmbryoObject(flags),
    zEmbryoEntry(flags),
  ])
    .pipe(z.object({
      flags: flags,
      entry: zEntry.optional(),
      args: z.array(z.string()).default([]),
      env: z.record(z.string()).default({}),
    }));

const zAnyEmbryo = zEmbryo(allFlags);

export type Embryo = z.infer<typeof zAnyEmbryo>;
