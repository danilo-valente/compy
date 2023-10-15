import { Egg } from '../../../types.ts';

export default {
  entry: './mod.ts',
  allow: ['env', 'net', 'read', 'write'],
  unstable: true,

  cache: './mod.ts',
  start: {
    entry: './src/run.ts',
    env: {
      ENV_TYPE: 'production',
      PORT: '3000',
    },
  },
  dev: {
    env: {
      ENV_TYPE: 'development',
    },
  },
  test: {
    entry: 'spec/',
    lock: 'test.deno.lock',
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: './src/',
  lint: './src/',
  run: {
    script: {
      entry: './script.ts',
      lock: 'script.deno.lock',
    },
  },
} satisfies Egg;
