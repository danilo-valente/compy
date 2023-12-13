import { paramCase } from '../deps/case.ts';
import * as z from '../deps/zod.ts';

export const zUnstableFeature = z.union([
  z.boolean(),
  z.string(),
  z.array(z.string()).transform((values) => values.join(',')),
]);

export const zUnstable = z.object({
  bareNodeBuiltins: zUnstableFeature,
  byonm: zUnstableFeature,
  workspaces: zUnstableFeature,
  broadcastChannel: zUnstableFeature,
  ffi: zUnstableFeature,
  fs: zUnstableFeature,
  kv: zUnstableFeature,
  net: zUnstableFeature,
  http: zUnstableFeature,
  workerOptions: zUnstableFeature,
  cron: zUnstableFeature,
  hmr: zUnstableFeature,
});

export type Unstable = z.infer<typeof zUnstable>;

export const zUnstableFlags = z.union([
  zUnstable.keyof(),
  z.array(zUnstable.keyof()),
  zUnstable.partial(),
]);

export type UnstableFlags = z.infer<typeof zUnstableFlags>;

const parseUnstable = (flags: UnstableFlags): Partial<Unstable> => {
  if (typeof flags === 'string') {
    return { [flags]: true };
  }

  if (Array.isArray(flags)) {
    return flags.reduce((map, flag) => ({
      ...map,
      [flag]: true,
    }), {});
  }

  if (typeof flags === 'object') {
    return flags;
  }

  throw new Deno.errors.InvalidData('Invalid unstable settings');
};

export const buildUnstable = (flags: UnstableFlags): string[] => {
  const unstable = parseUnstable(flags);

  return Object.entries(unstable).reduce<string[]>((list, [feature, value]) => {
    const name = paramCase(feature);

    if (value === true) {
      list.push(`--unstable-${name}`);
    } else if (typeof value === 'string') {
      list.push(`--unstable-${name}=${value}`);
    } else if (Array.isArray(value)) {
      list.push(`--unstable-${name}=${value.join(',')}`);
    }

    return list;
  }, []);
};
