import { Egg } from '../../../types.ts';

export default {
  entry: './src/mod.ts',

  dev: {
    env: {
      ENV_TYPE: 'development',
    },
  },
  test: {
    entry: 'spec/',
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: 'src/',
  lint: 'src/',
} satisfies Egg;
