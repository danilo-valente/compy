import { Command } from 'cliffy/command/mod.ts';

import info from '../../info.json' assert { type: 'json' };

import { init } from './init.ts';
import { mod } from './module.ts';
import { add } from './add.ts';
import { cache, dev, fmt, lint, start, test } from './deno.ts';
import { ash, bash, fish, sh, zsh } from './sh.ts';

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
  // sh
  .command('sh', sh)
  .command('bash', bash)
  .command('zsh', zsh)
  .command('ash', ash)
  .command('fish', fish);
