import * as z from 'zod/mod.ts';

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

const zEmbryoEntry = zEntry.transform((entry) => ({ entry }))
  .pipe(zEmbryoObject(z.object({})));

export const zEmbryo = <F extends z.AnyZodObject>(flags: F) =>
  z.union([
    zEmbryoObject(flags),
    zEmbryoEntry,
  ])
    .pipe(z.object({
      flags: flags,
      entry: zEntry.optional(),
      args: z.array(z.string()).default([]),
      env: z.record(z.string()).default({}),
    }));

export type Embryo = z.infer<ReturnType<typeof zEmbryo>>;
