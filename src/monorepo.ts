import { assert } from 'std/assert/assert.ts';
import { dim, green, italic, white, yellow } from 'std/fmt/colors.ts';
import { basename } from 'std/path/basename.ts';
import { dirname } from 'std/path/dirname.ts';
import { relative } from 'std/path/relative.ts';

import { Compy } from '~/compy.ts';
import { ConfigLoader } from '~/config.ts';
import { Embryo } from '~/embryo.ts';

import cacheDef from '~/commands/cache.ts';
import fmtDef from '~/commands/fmt.ts';
import lintDef from '~/commands/lint.ts';
import runDef from '~/commands/run.ts';
import testDef from '~/commands/test.ts';

// TODO(danilo-valente): add support for other commands: bench, check, compile, doc, eval, repl
const cli = {
  cache: cacheDef,
  fmt: fmtDef,
  lint: lintDef,
  run: runDef,
  start: runDef,
  dev: runDef,
  test: testDef,
};

export type Cmd = keyof typeof cli;

// TODO(danilo-valente): implement command to create new modules/eggs (lib and app)
// TODO(danilo-valente): implement command to list all modules/eggs
// TODO(danilo-valente): implement command to install modules (add to import_map with scope and cache files)
// TODO(danilo-valente): add flag to specify env file

// TODO(danilo-valente): multiple roots

export const buildLogger = (cmd: Cmd) => {
  return (tag: string, ...data: string[]) => {
    if (data.length === 0) {
      return;
    }

    console.log(
      green(`[compy:${cmd}]`),
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
};

export type ShellCommand = {
  userCwd: string;
  exec: string | URL;
  cwd: string;
  args: string[];
  env: Record<string, string>;
  log: ReturnType<typeof buildLogger>;
};

export const buildNative = async (compy: Compy, cmd: Cmd, eggName: string, argv: string[]): Promise<ShellCommand> => {
  assert(eggName, 'Missing package name');
  assert(cmd, 'Missing command');

  const egg = await compy.eggs.load(eggName);

  // TODO(danilo-valente): provide ability to merge config files
  const configLoader = new ConfigLoader({ cwd: compy.root, glob: compy.config.config });
  const configPath = await configLoader.lookup();

  const buildCliCmd = (cmd: Cmd, embryo?: Embryo) => {
    const cliCmd = cli[cmd];

    const mergedEmbryo: Embryo = {
      flags: cliCmd.flags.strip().parse({
        ...egg.config.flags,
        ...embryo?.flags,
      }),
      entry: embryo?.entry || egg.config.entry,
      args: embryo?.args ?? [],
      env: embryo?.env ?? {},
    };

    assert(mergedEmbryo.entry, 'Missing entry file');

    const configRelativePath = configPath ? relative(egg.nest, configPath) : null;
    const { command, args } = cliCmd.build(configRelativePath, mergedEmbryo.flags);

    return {
      exec: command,
      env: mergedEmbryo.env,
      args: [
        ...args,
        mergedEmbryo.entry,
        ...mergedEmbryo.args,
      ],
    };
  };

  const buildExtCmd = (cmd: string) => {
    // TODO(danilo-valente): implement command inheritance
    const extCmd = egg.config.ext?.[cmd];
    assert(extCmd, `Missing extended command ${cmd}`);

    const [exec, ...args] = Array.isArray(extCmd) ? extCmd : [extCmd];
    return {
      exec,
      env: {},
      args,
    };
  };

  const buildCmd = (cmd: string) => {
    switch (cmd) {
      case 'test':
        return buildCliCmd(cmd, egg.config.test);
      case 'fmt':
        return buildCliCmd(cmd, egg.config.fmt);
      case 'lint':
        return buildCliCmd(cmd, egg.config.lint);
      case 'cache':
        return buildCliCmd(cmd, egg.config.cache);
      case 'start':
        return buildCliCmd(cmd, egg.config.start);
      case 'dev':
        return buildCliCmd(cmd, egg.config.dev);
      case 'run':
        // TODO(danilo-valente): decide what to do with `run`
        throw new Deno.errors.InvalidData(`Unsupported (but reserved) command ${cmd}`);
    }

    if (egg.config.run?.[cmd]) {
      return buildCliCmd('run', egg.config.run[cmd]);
    }

    if (cmd in (egg.config.ext ?? {})) {
      return buildExtCmd(cmd);
    }

    throw new Deno.errors.InvalidData(`Invalid command ${cmd}`);
  };

  const { exec, env, args } = buildCmd(cmd);
  const commandArgs = [
    ...args,
    ...argv,
  ];

  return {
    userCwd: compy.cwd,
    exec,
    cwd: egg.nest,
    args: commandArgs,
    env,
    log: buildLogger(cmd),
  };
};

export const runNative = async ({ userCwd, cwd, exec, args, env, log }: ShellCommand) => {
  log('cwd:', relative(userCwd, cwd));

  log(
    '$',
    exec.toString(),
    ...args,
  );

  log(
    'env:',
    ...Object.entries(env).map(([key, value]) => italic(`\n    - ${key}=${String(value).replace(/./g, '*')}`)),
  );

  const command = new Deno.Command(exec, {
    cwd: cwd,
    env: env,
    args: args,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  });

  const process = command.spawn();

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

  return code;
};
