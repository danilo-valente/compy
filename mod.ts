import { assert } from 'https://deno.land/std@v0.200.0/assert/assert.ts';
import { exists } from 'https://deno.land/std@v0.200.0/fs/exists.ts';
import { dirname } from 'https://deno.land/std@v0.200.0/path/dirname.ts';
import { basename } from 'https://deno.land/std@v0.200.0/path/basename.ts';
import { resolve } from 'https://deno.land/std@v0.200.0/path/resolve.ts';
import { relative } from 'https://deno.land/std@v0.200.0/path/relative.ts';
import { dim, green, italic, white, yellow } from 'https://deno.land/std@v0.200.0/fmt/colors.ts';

import type {
  Cmd,
  CompyShell,
  EggShell,
  Embryo,
  Embryos,
  EntryOrEmbryo,
  Flags,
  PermissionFlags,
  Permissions,
} from './types.ts';

// TODO(danilo-valente): generate WASM executable

// TODO(danilo-valente): implement command to create new modules/eggs (lib and app)
// TODO(danilo-valente): implement command to list all modules/eggs
// TODO(danilo-valente): add flag to specify env file

// TODO(danilo-valente): accept globs and multiple roots
// TODO(danilo-valente): recursively look for compy.ts in parent directories
const compyPath = resolve(Deno.cwd(), './.compy.ts');

const { default: compy }: CompyShell = await import(`file://${compyPath}`);

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

const buildPermissions = (flags: PermissionFlags, directive: 'allow' | 'deny'): string[] => {
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

const flagBuilders = {
  runtime: (flags: Partial<Flags.All>) =>
    [
      ...flags.allow === true ? ['-A'] : buildPermissions(flags.allow ?? [], 'allow'),
      ...buildPermissions(flags.deny ?? [], 'deny'),
      flags.check ? '--check' : '',
      flags.inspect ? `--inspect=${flags.inspect}` : '',
      flags.inspectBrk ? `--inspect-brk=${flags.inspectBrk}` : '',
      flags.inspectWait ? `--inspect-wait=${flags.inspectWait}` : '',
      flags.location ? `--location=${flags.location}` : '',
      flags.prompt ? '--prompt' : '',
      flags.seed ? `--seed=${flags.seed}` : '',
      flags.v8Flags ? `--v8-flags=${flags.v8Flags}` : '',
    ].filter((flag) => flag),

  compilation: (flags: Partial<Flags.All>) =>
    [
      flags.config ? `--config=${flags.config}` : '',
      flags.importMap ? `--import-map=${flags.importMap}` : '',
      flags.noRemote ? '--no-remote' : '',
      flags.reload ? `--reload=${flags.reload}` : '',
      flags.unstable ? '--unstable' : '',
      flags.watch ? '--watch' : '',
    ].filter((flag) => flag),

  lock: (flags: Partial<Flags.All>) =>
    [
      flags.lock ? `--lock=${flags.lock}` : '',
      flags.lockWrite ? '--lock-write' : '',
    ].filter((flag) => flag),

  watch: (flags: Partial<Flags.All>) =>
    [
      flags.watch ? '--watch' : '',
    ].filter((flag) => flag),
};

export default async (cmd: Cmd, eggName: string, argv: string[]) => {
  assert(eggName, 'Missing package name');
  assert(cmd, 'Missing command');

  const nest = resolve(compy.nests ?? 'packages', eggName);

  // TODO(danilo-valente): add support for plain .compy.egg.json files
  const eggPath = `${nest}/.compy.egg.ts`;
  const { default: egg }: EggShell = await import(`file://${eggPath}`);

  const eggLaid = await exists(eggPath, {
    isReadable: true,
    isFile: true,
  });

  assert(eggLaid, `Missing egg file ${eggPath}`);

  // TODO(danilo-valente): provide ability to merge config files
  const configPath = relative(nest, resolve(dirname(compyPath), compy.config ?? 'deno.json'));

  const cli = (command: string, flags: Flags.All, flagTypes: (keyof typeof flagBuilders)[]) => [
    Deno.execPath(),
    command,
    '-c',
    configPath,
    ...flagTypes.flatMap((type) => flagBuilders[type](flags)),
  ];

  const denoCli = {
    cache: (flags: Flags.All) => cli('cache', flags, ['compilation', 'lock']),
    run: (flags: Flags.All) => cli('run', flags, ['runtime', 'compilation', 'lock']),
    get start() {
      return this.run;
    },
    get dev() {
      return this.run;
    },
    test: (flags: Flags.All) => cli('test', flags, ['runtime', 'compilation', 'lock', 'watch']),
    fmt: (flags: Flags.All) => cli('fmt', flags, ['compilation', 'watch']),
    lint: (flags: Flags.All) => cli('lint', flags, ['compilation', 'watch']),
  };

  // TODO(danilo-valente): use zod to parse egg files
  const parseCmd = (cmd: Cmd, eggCmd?: EntryOrEmbryo<Embryos.Any>): Embryo => {
    const { entry, ...flags } = egg;

    if (!eggCmd) {
      assert(egg.entry, `Must provide at least an entry for command ${cmd} a for the egg`);

      return {
        ...flags,
        entry: egg.entry,
        args: [],
        env: {},
      };
    }

    if (typeof eggCmd === 'string') {
      return {
        ...flags,
        entry: eggCmd,
        args: [],
        env: {},
      };
    }

    if (typeof eggCmd === 'object') {
      const entry = eggCmd.entry ?? egg.entry;
      assert(entry, `Must provide at least one entry for command ${cmd} or one for the egg`);

      return {
        ...flags,
        ...eggCmd,
        entry: entry,
        args: eggCmd.args ?? [],
        env: eggCmd.env ?? {},
      };
    }

    throw new Deno.errors.InvalidData(`Invalid definition for command ${cmd}`);
  };

  const buildNativeCmd = (cmd: Cmd, eggCmd?: EntryOrEmbryo<Embryos.Any>) => {
    const embryo = parseCmd(cmd, eggCmd);
    const [exec, ...flags] = denoCli[cmd](embryo);

    return {
      exec,
      env: embryo.env,
      args: [
        ...flags,
        embryo.entry,
        ...embryo.args,
      ],
    };
  };

  const buildExtCmd = (cmd: string) => {
    // TODO(danilo-valente): implement command inheritance
    const extCmd = egg.ext?.[cmd];
    assert(extCmd, `Missing extended command ${cmd}`);

    const [exec, ...args] = Array.isArray(extCmd) ? extCmd : [extCmd];
    return {
      exec,
      env: {},
      args,
    };
  };

  const buildCmd = (cmd: string) => {
    if (cmd in denoCli) {
      // FIXME(danilo-valente): provide proper type check
      return buildNativeCmd(cmd as Cmd, egg[cmd as Cmd]);
    }

    if (egg.run?.[cmd]) {
      // FIXME(danilo-valente): provide proper type check
      return buildNativeCmd('run' as Cmd, egg.run[cmd]);
    }

    if (cmd in (egg.ext ?? {})) {
      return buildExtCmd(cmd);
    }

    throw new Deno.errors.InvalidData(`Invalid command ${cmd}`);
  };

  const { exec, env, args } = buildCmd(cmd);
  const commandArgs = [
    ...args,
    ...argv,
  ];

  const log = (tag: string, ...data: string[]) => {
    if (data.length === 0) {
      return;
    }

    console.log(
      green('[compy]'),
      yellow(tag),
      ...data.map((arg) => {
        if (arg.startsWith('-')) {
          return arg;
        }

        if (arg.startsWith('/')) {
          return `${dim(dirname(arg) + '/')}${white(basename(arg))}`;
        }

        if (arg.startsWith('./') || arg.startsWith('../')) {
          return `${dirname(arg) + '/'}${white(basename(arg))}`;
        }

        return arg;
      }),
    );
  };

  log('cwd:', relative(Deno.cwd(), nest));

  log(
    '$',
    exec,
    ...commandArgs,
  );

  log(
    'env:',
    ...Object.entries(env).map(([key, value]) => italic(`\n    - ${key}=${String(value).replace(/./g, '*')}`)),
  );

  const command = new Deno.Command(exec, {
    cwd: nest,
    env: env,
    args: commandArgs,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  });

  const process = await command.spawn();

  process.stdout.pipeTo(Deno.stdout.writable);
  process.stderr.pipeTo(Deno.stderr.writable);

  Deno.addSignalListener('SIGINT', () => {
    process.kill('SIGINT');
    Deno.exit(0);
  });

  Deno.addSignalListener('SIGTERM', () => {
    process.kill('SIGTERM');
    Deno.exit(1);
  });

  // Deno.addSignalListener('SIGKILL', () => {
  //   process.kill('SIGKILL');
  //   Deno.exit(1);
  // });

  const { code } = await process.status;
  Deno.exit(code);
};
