import { Egg } from '../../../types.ts';

export default {
  entry: './mod.ts',
  allow: ['env', 'net', 'read', 'write'],
  unstable: true,

  cache: './mod.ts',
  start: './src/run.ts',
  dev: {
    env: {
      ENV_TYPE: 'development',
    },
  },
  test: {
    entry: 'spec/',
    // TODO(danilo-valente): extend test.deno.lock from deno.lock
    lock: 'test.deno.lock',
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: './src/',
  lint: './src/',
  run: {
    migrate: {
      entry: './ley/cli.ts',
      lock: 'ley.deno.lock',
    },
  },
  ext: {
    'test.watch': '--watch=src/,spec/',
  },
} satisfies Egg;
