import { assert, basename, dim, dirname, green, italic, relative, white, yellow } from '../deps/std.ts';

import { Compy } from './compy.ts';
import { Egg } from './egg.ts';
import { Embryo } from './embryo.ts';

import cacheDef from './commands/cache.ts';
import fmtDef from './commands/fmt.ts';
import lintDef from './commands/lint.ts';
import runDef from './commands/run.ts';
import testDef from './commands/test.ts';

// TODO(danilo-valente): add support for other commands: bench, check, compile, doc, eval, repl, task
const cli = {
  cache: cacheDef,
  fmt: fmtDef,
  lint: lintDef,
  start: runDef,
  dev: runDef,
  test: testDef,
};

export type Cmd = keyof typeof cli;

// TODO(danilo-valente): add flag to specify env file

// TODO(danilo-valente): multiple roots

export const buildLogger = (scope: string, writer: Deno.Writer) => {
  const encoder = new TextEncoder();
  const write = (text: string) => writer.write(encoder.encode(`${text} `));

  const mask = (arg: string) => {
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
  };

  return (tag: string, ...data: string[]) => {
    if (data.length === 0) {
      return;
    }

    write(green(`[compy:${scope}]`));
    write(yellow(tag));

    for (const arg of data) {
      write(mask(arg));
    }

    writer.write(encoder.encode('\n'));
  };
};

export type CompyCmd = [Cmd] | ['run', string];

export type ShellCommand = {
  userCwd: string;
  cmd: CompyCmd;
  exec: string | URL;
  cwd: string;
  args: string[];
  env: Record<string, string>;
};

export const loadNative = async (
  compy: Compy,
  cmd: CompyCmd,
  eggName: string,
  /**
   * @deprecated remove support for `argv` in favor of `egg.config.args`
   */
  argv?: string[],
) => {
  assert(eggName, 'Missing package name');

  const egg = await compy.eggs.mapAndLoad(eggName);

  return buildNative(compy, egg, cmd, argv);
};

export const buildNative = (
  compy: Compy,
  egg: Egg,
  compyCmd: CompyCmd,
  /**
   * @deprecated remove support for `argv` in favor of `egg.config.args`
   */
  argv?: string[],
): ShellCommand => {
  const [cmd, script] = compyCmd;

  const buildEmbryo = () => {
    if (cmd === 'run') {
      const embryo = egg.config.run?.[script];
      assert(embryo, `Missing 'run.${script}' config`);

      const cliCmd = runDef;

      return { embryo, cliCmd };
    }

    const embryo = egg.config[cmd];
    const cliCmd = cli[cmd];

    return { embryo, cliCmd };
  };

  // TODO(danilo-valente): implement command inheritance
  const buildCli = () => {
    const { embryo, cliCmd } = buildEmbryo();

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

    // TODO(danilo-valente): provide ability to merge config files
    const configRelativePath = relative(egg.nest, compy.denoConfig.path);
    const { command, args } = cliCmd.build({
      config: configRelativePath,
      ...mergedEmbryo.flags,
    });

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

  const { exec, env, args: cliArgs } = buildCli();
  const args = [
    ...cliArgs,
    ...(argv ?? []),
  ];

  return {
    userCwd: compy.cwd,
    cmd: compyCmd,
    exec,
    cwd: egg.nest,
    args,
    env,
  };
};

export type RunNativeOptions = {
  log?: boolean;
  stdout?: Deno.Writer & { writable: WritableStream<Uint8Array> };
  stderr?: Deno.Writer & { writable: WritableStream<Uint8Array> };
  signal?: AbortSignal;
};

export const runNative = async (
  { userCwd, cmd, cwd, exec, args, env }: ShellCommand,
  {
    log: logging = true,
    stdout = Deno.stdout,
    stderr = Deno.stderr,
    signal,
  }: RunNativeOptions = {},
): Promise<Deno.CommandStatus> => {
  const log = logging ? buildLogger(cmd.join(':'), stdout) : () => {};

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

  const abortController = new AbortController();

  const command = new Deno.Command(exec, {
    cwd: cwd,
    env: env,
    args: args,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
    signal: abortController.signal,
  });

  const process = command.spawn();

  process.stdout.pipeTo(stdout.writable, { preventClose: true });
  process.stderr.pipeTo(stderr.writable, { preventClose: true });

  const sigintHandler = () => process.kill('SIGINT');
  const sigtermHandler = () => abortController.abort();

  Deno.addSignalListener('SIGINT', sigintHandler);
  Deno.addSignalListener('SIGTERM', sigtermHandler);

  signal?.addEventListener('abort', sigtermHandler);

  const status = await process.status;

  Deno.removeSignalListener('SIGINT', sigintHandler);
  Deno.removeSignalListener('SIGTERM', sigtermHandler);
  signal?.removeEventListener('abort', sigtermHandler);

  return status;
};

export const exportNative = async (native: ShellCommand, shell: string) => {
  const shEnv = Object.entries(native.env).map(
    ([key, value]) => `export ${key}="${value.replace(/"/g, '\\"')}"`,
  );

  const shArgs = native.args.map(
    (arg) => arg.replace(/([\\\s])/g, '\\$1'),
  );

  const script = `
    #!/usr/bin/env ${shell}

    # Script generated by compy
    # https://deno.land/x/compy

    cd ${native.cwd}

    ${shEnv.join('\n')}

    ${native.exec} ${shArgs.join(' ')}
  `;

  return script
    .replace(/^[ \t]+/gm, '')
    .replace(/\n{3,}/g, '\n\n');
};
