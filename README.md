# Compy
Minimalist (yet helpful) monorepo manager for Deno

## Installation

```sh
deno install -n compy \
  --allow-env --allow-read --allow-run --allow-sys --allow-net --unstable \
  --import-map='https://deno.land/x/compy/import_map.json' \
  -f 'https://deno.land/x/compy/run.ts'
```

## Usage

```sh
compy <cache|start|dev|test|fmt|lint> <target> [...args]
```

## Files

### `<root>/.compy.ts`

```typescript
import { Compy } from 'https://deno.land/x/compy/types.ts';

export default {
  modules: 'packages',
  config: 'deno.jsonc',
} satisfies Compy;
```

### `<root>/packages/<package>/.compy.egg.ts`

```typescript
import { Egg } from 'https://deno.land/x/compy/types.ts';

export default {
  entry: './src/run.ts',
  allow: ['env', 'net', 'read', 'write'],
  unstable: true,

  cache: './src/run.ts',
  start: './src/run.ts',
  dev: './src/run.ts',
  test: {
    entry: 'spec/',
    lock: 'test.deno.lock',
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: './src/',
  lint: './src/',
  // ext: {
  //   tag: 'git tag',
  // },
} satisfies Egg;
```
