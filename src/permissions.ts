import * as z from '../deps/zod.ts';

export const sysPermission = z.union([
  z.literal('hostname'),
  z.literal('osRelease'),
  z.literal('osUptime'),
  z.literal('loadavg'),
  z.literal('networkInterfaces'),
  z.literal('systemMemoryInfo'),
  z.literal('uid'),
  z.literal('gid'),
]);

export type SysPermission = z.infer<typeof sysPermission>;

export const permissionScope = <T extends z.ZodTypeAny>(schema: T) => z.union([z.boolean(), schema, z.array(schema)]);

// Reference: https://deno.land/manual@v1.36.3/basics/permissions#permissions-list
export const permissions = z.object({
  env: permissionScope(z.string()),
  sys: permissionScope(sysPermission),
  hrtime: permissionScope(z.never()),
  net: permissionScope(z.string()),
  ffi: permissionScope(z.string()),
  read: permissionScope(z.string()),
  run: permissionScope(z.string()),
  write: permissionScope(z.string()),
});

export type Permissions = z.infer<typeof permissions>;

export const permissionFlags = z.union([
  permissions.keyof(),
  z.array(permissions.keyof()),
  permissions.partial(),
]);

export type PermissionFlags = z.infer<typeof permissionFlags>;

const parsePermissions = (flags: PermissionFlags, directive: 'allow' | 'deny'): Partial<Permissions> => {
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

  throw new Deno.errors.InvalidData(`Invalid permissions for ${directive}`);
};

export const buildPermissions = (flags: PermissionFlags, directive: 'allow' | 'deny'): string[] => {
  const permissions = parsePermissions(flags, directive);

  return Object.entries(permissions).reduce<string[]>((list, [permission, value]) => {
    if (value === true) {
      list.push(`--${directive}-${permission}`);
    } else if (typeof value === 'string') {
      list.push(`--${directive}-${permission}=${value}`);
    } else if (Array.isArray(value)) {
      list.push(`--${directive}-${permission}=${value.join(',')}`);
    }

    return list;
  }, []);
};
