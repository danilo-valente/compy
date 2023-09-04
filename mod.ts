import { assert } from 'std/assert/assert.ts';
import { dim, green, italic, white, yellow } from 'std/fmt/colors.ts';
import { basename } from 'std/path/basename.ts';
import { dirname } from 'std/path/dirname.ts';
import { relative } from 'std/path/relative.ts';
import { resolve } from 'std/path/resolve.ts';

import { CompyLoader } from './src/compy.ts';
import { ConfigLoader } from './src/config.ts';
import { EggLoader } from './src/egg.ts';
import { Embryo, zEntry } from './src/embryo.ts';

import cacheDef from './src/commands/cache.ts';
import fmtDef from './src/commands/fmt.ts';
import lintDef from './src/commands/lint.ts';
import runDef from './src/commands/run.ts';
import testDef from './src/commands/test.ts';

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

// TODO(danilo-valente): generate WASM executable

// TODO(danilo-valente): implement command to create new modules/eggs (lib and app)
// TODO(danilo-valente): implement command to list all modules/eggs
// TODO(danilo-valente): implement command to install modules (add to import_map with scope and cache files)
// TODO(danilo-valente): add flag to specify env file

// TODO(danilo-valente): multiple roots

const compyLoader = new CompyLoader();

const [compyDir, compy] = await compyLoader.load();

export default async (cmd: Cmd, eggName: string, argv: string[]) => {
  assert(eggName, 'Missing package name');
  assert(cmd, 'Missing command');

  const nests = resolve(compyDir, compy.modules);
  const eggLoader = new EggLoader({ cwd: nests });

  const [nest, egg] = await eggLoader.load(eggName);

  // TODO(danilo-valente): provide ability to merge config files
  const configLoader = new ConfigLoader({ cwd: compyDir, glob: compy.config });
  const configPath = await configLoader.lookup();

  const buildCliCmd = (cmd: Cmd, entryOrEmbryo: Embryo = egg[cmd]) => {
    const cliCmd = cli[cmd];

    const embryo: Embryo = {
      flags: cliCmd.flags.strip().parse({
        ...egg.flags,
        ...entryOrEmbryo.flags,
      }),
      entry: zEntry.parse(entryOrEmbryo.entry || egg.entry),
      args: entryOrEmbryo.args,
      env: entryOrEmbryo.env,
    };

    const configRelativePath = configPath ? relative(nest, configPath) : null;
    const { command, args } = cliCmd.build(configRelativePath, embryo.flags);

    return {
      exec: command,
      env: embryo.env,
      args: [
        ...args,
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
    if (cmd === 'run') {
      // TODO(danilo-valente): decide what to do with `run`
      throw new Deno.errors.InvalidData(`Unsupported (but reserved) command ${cmd}`);
    }

    if (cmd in cli) {
      // FIXME(danilo-valente): provide proper type check
      return buildCliCmd(cmd as Cmd);
    }

    if (egg.run?.[cmd]) {
      // FIXME(danilo-valente): provide proper type check
      return buildCliCmd('run' as Cmd, egg.run[cmd]);
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
