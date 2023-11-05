import { Command } from '../../deps/cliffy.ts';

import info from '../../info.json' assert { type: 'json' };

import { add } from './add.ts';
import { cache, dev, fmt, lint, run, start, test } from './deno.ts';
import { init } from './init.ts';
import { mod } from './module.ts';

export default new Command()
  .name('compy')
  .version(info.version)
  .description('Minimalist (yet helpful) monorepo manager for Deno')
  // Management
  .command('init', init)
  .command('mod', mod)
  .command('add', add)
  // Deno
  .command('cache', cache)
  .command('fmt', fmt)
  .command('lint', lint)
  .command('test', test)
  .command('start', start)
  .command('dev', dev)
  .command('run', run);
