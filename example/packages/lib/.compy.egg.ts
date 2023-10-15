import { Egg } from 'https://deno.land/x/compy@v0.0.8/types.ts';

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
