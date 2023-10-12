import { assert } from 'std/assert/assert.ts';
import { dim, green, italic, white, yellow } from 'std/fmt/colors.ts';
import { basename } from 'std/path/basename.ts';
import { dirname } from 'std/path/dirname.ts';
import { relative } from 'std/path/relative.ts';
import { resolve } from 'std/path/resolve.ts';

import { CompyLoader } from '~/compy.ts';
import { ConfigLoader } from '~/config.ts';
import { EggLoader } from '~/egg.ts';
import { Embryo } from '~/embryo.ts';

import cacheDef from '~/commands/cache.ts';
import fmtDef from '~/commands/fmt.ts';
import lintDef from '~/commands/lint.ts';
import checkDef from '~/commands/check.ts';
import runDef from '~/commands/run.ts';
import testDef from '~/commands/test.ts';

// TODO(danilo-valente): add support for other commands: bench, check, compile, doc, eval, repl
const cli = {
  cache: cacheDef,
  fmt: fmtDef,
  lint: lintDef,
  check: checkDef,
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

export default async (cmd: Cmd, eggName: string, argv: string[]) => {
  assert(eggName, 'Missing package name');
  assert(cmd, 'Missing command');

  const compyLoader = new CompyLoader();

  const [compyDir, compy] = await compyLoader.load();

  const nests = resolve(compyDir, compy.modules);
  const eggLoader = new EggLoader({ cwd: nests });

  const [nest, egg] = await eggLoader.load(eggName);

  // TODO(danilo-valente): provide ability to merge config files
  const configLoader = new ConfigLoader({ cwd: compyDir, glob: compy.config });
  const configPath = await configLoader.lookup();

  const buildCliCmd = (cmd: Cmd, embryo?: Embryo) => {
    const cliCmd = cli[cmd];

    const mergedEmbryo: Embryo = {
      flags: cliCmd.flags.strip().parse({
        ...egg.flags,
        ...embryo?.flags,
      }),
      entry: embryo?.entry || egg.entry,
      args: embryo?.args ?? [],
      env: embryo?.env ?? {},
    };

    assert(mergedEmbryo.entry, 'Missing entry file');

    const configRelativePath = configPath ? relative(nest, configPath) : null;
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
    switch (cmd) {
      case 'test':
        return buildCliCmd(cmd, egg.test);
      case 'fmt':
        return buildCliCmd(cmd, egg.fmt);
      case 'lint':
        return buildCliCmd(cmd, egg.lint);
      case 'check':
        return buildCliCmd(cmd, egg.check);
      case 'cache':
        return buildCliCmd(cmd, egg.cache);
      case 'start':
        return buildCliCmd(cmd, egg.start);
      case 'dev':
        return buildCliCmd(cmd, egg.dev);
      case 'run':
        // TODO(danilo-valente): decide what to do with `run`
        throw new Deno.errors.InvalidData(`Unsupported (but reserved) command ${cmd}`);
    }

    if (egg.run?.[cmd]) {
      return buildCliCmd('run', egg.run[cmd]);
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
  Deno.exit(code);
};
