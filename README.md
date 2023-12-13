# Compy
Minimalist (yet helpful) monorepo manager for Deno

## Motivation

- [Does deno support monorepo? #9126](https://github.com/denoland/deno/discussions/9126)
- [Microservices with Deno as a Monorepo #18143](https://github.com/denoland/deno/discussions/18143)
- [Support deno.config in a multi-root workspace #501](https://github.com/denoland/vscode_deno/issues/501)

## Installation

```sh
deno install --unstable -Ar -n compy -f 'https://deno.land/x/compy/run.ts'
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
compy add <name> [version] [-m <module>] [-u <url>]
```

### Run a Deno command in each modules' context

```sh
compy <cache|test|fmt|lint>
```

### Run a Deno command in a module's context

```sh
compy <cache|start|dev|run|test|fmt|lint> <module> [...args]
compy <run> <module> <task> [...args]
```

### Generate a shell script to run a Deno command in a module's context

```sh
compy <cache|start|dev|run|test|fmt|lint> -e <sh|bash|zsh|ash|fish> <module> [...args]
compy <run> -e <sh|bash|zsh|ash|fish> <module> <task> [...args]
```

## Files

### `<root>/.compy.ts`

```typescript
import { Compy } from 'https://deno.land/x/compy/types.ts';

export default {
  name: 'my-project',
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
} satisfies Egg;
```
