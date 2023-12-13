import { Egg } from '../../../types.ts';

export default {
  entry: './mod.ts',
  allow: ['env', 'net', 'read', 'write'],
  unstable: true,

  cache: {
    entry: './mod.ts',
    reload: true,
  },
  start: {
    entry: './src/run.ts',
    env: {
      ENV_TYPE: 'production',
      PORT: '3000',
    },
  },
  dev: {
    watch: ['mod.ts', './src/run.ts'],
    check: true,
    env: {
      ENV_TYPE: 'development',
    },
  },
  test: {
    entry: 'spec/',
    watch: true,
    check: true,
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: './src/',
  lint: './src/',
  run: {
    script: {
      entry: './script.ts',
    },
  },
} satisfies Egg;
