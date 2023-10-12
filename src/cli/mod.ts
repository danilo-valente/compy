import { Command } from 'cliffy/command/mod.ts';

import info from '../../info.json' assert { type: 'json' };

import { cache, dev, fmt, lint, start, test } from './deno.ts';

export default new Command()
  .name('compy')
  .version(info.version)
  .description('Minimalist (yet helpful) monorepo manager for Deno')
  .command('cache', cache)
  .command('fmt', fmt)
  .command('lint', lint)
  .command('test', test)
  .command('start', start)
  .command('dev', dev);
