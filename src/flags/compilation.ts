import * as z from 'zod/mod.ts';

export const compilation = z.object({
  config: z.string().optional(),
  importMap: z.string().optional(),
  noRemote: z.boolean().optional(),
  reload: z.union([z.boolean(), z.string()]).optional(),
  unstable: z.boolean().optional(),
}).strict();

export const compilationTransformer = (flags: z.infer<typeof compilation>) =>
  [
    flags.config ? `--config=${flags.config}` : undefined,
    flags.importMap ? `--import-map=${flags.importMap}` : undefined,
    flags.noRemote ? '--no-remote' : undefined,
    flags.reload ? `--reload=${flags.reload}` : undefined,
    flags.unstable ? '--unstable' : undefined,
  ].filter(Boolean);
