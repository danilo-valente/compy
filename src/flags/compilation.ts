import * as z from 'zod/mod.ts';

export const compilation = {
  config: z.string().optional(),
  importMap: z.string().optional(),
  noRemote: z.boolean().optional(),
  reload: z.union([z.boolean(), z.string()]).optional(),
  unstable: z.boolean().optional(),
};

const compilationSchema = z.object(compilation).strict();

export const compilationTransformer = (flags: z.infer<typeof compilationSchema>) =>
  [
    flags.config ? `--config=${flags.config}` : undefined,
    flags.importMap ? `--import-map=${flags.importMap}` : undefined,
    flags.noRemote ? '--no-remote' : undefined,
    flags.reload ? `--reload=${flags.reload}` : undefined,
    flags.unstable ? '--unstable' : undefined,
  ].filter(Boolean);
