import { paramCase } from '../../deps/case.ts';
import { z } from '../../deps/zod.ts';

export const zFlagValue = z.union([
  z.boolean(),
  z.number(),
  z.string(),
  z.array(z.string()).transform((values) => values.join(',')),
]).optional();

type FlagValue = z.infer<typeof zFlagValue>;

export const buildFlag = (name: string, value: FlagValue | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const flagName = `--${paramCase(name)}`;
  if (value === true) {
    return flagName;
  }

  return `${flagName}=${value}`;
};

export const buildFlags = <T extends Record<string, FlagValue>>(flagMap: T, subset: (keyof T)[]) =>  {
  const flags = subset.map((name) =>
    buildFlag(name.toString(), flagMap[name])
  );

  return flags.filter((flag): flag is string => flag !== undefined);
};
