# Compy
Minimalist (yet helpful) monorepo manager for Deno

## Installation

```sh
deno install -n compy \
  --allow-env --allow-read --allow-write --allow-run --allow-sys --allow-net --unstable \
  --import-map='https://deno.land/x/compy/import_map.json' \
  -f 'https://deno.land/x/compy/run.ts'
```

## Usage

### Display help

```sh
compy -h
```

### Display version

```sh
compy -V
```

### Create a new Compy project

```sh
compy init <project> [-m=packages] [-c=deno.json] [-i=import_map.json]
```

### List or create a new module

```sh
compy mod
compy mod [module]
```

### Add external dependency to import_map.json

```sh
compy add <alias> <url>
compy add <name> [version]
```

### Run a Deno command in a module's context

```sh
compy <cache|start|dev|test|fmt|lint> <module> [...args]
```

### Generate a shell script to run a Deno command in a module's context

```sh
compy <sh|bash|zsh|ash|fish> <cache|start|dev|test|fmt|lint> <module> [...args]
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
