import * as z from '../deps/zod.ts';

import { allFlags } from './flags/all.ts';

export const zEntry = z.string().min(1);

type EmbryoDef<F extends z.AnyZodObject> = {
  flags: F;
  defaultEnv: Record<string, string>;
};

const zEmbryoObject = <F extends z.AnyZodObject>({ flags, defaultEnv }: EmbryoDef<F>) =>
  z.object({
    entry: zEntry,
    args: z.array(z.string()),
    env: z.record(z.string()).default(defaultEnv),
  })
    .partial()
    .merge(flags)
    .transform(({ entry, args, env, ...flags }) => ({
      flags,
      entry,
      args,
      env,
    }));

const zEmbryoEntry = <F extends z.AnyZodObject>(def: EmbryoDef<F>) =>
  zEntry.transform((entry) => ({ entry }))
    .pipe(zEmbryoObject(def));

export const zEmbryo = <F extends z.AnyZodObject>(
  flags: EmbryoDef<F>['flags'],
  defaultEnv: EmbryoDef<F>['defaultEnv'],
) => {
  const def: EmbryoDef<F> = { flags, defaultEnv };

  return z.union([
    zEmbryoObject(def),
    zEmbryoEntry(def),
  ])
    .pipe(z.object({
      flags: def.flags,
      entry: zEntry.optional(),
      args: z.array(z.string()).default([]),
      env: z.record(z.string()).default(def.defaultEnv),
    }));
};

const zAnyEmbryo = zEmbryo(allFlags, {});

export type Embryo = z.infer<typeof zAnyEmbryo>;
