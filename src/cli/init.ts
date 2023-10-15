import { resolve } from 'std/path/resolve.ts';
import { blue, green } from 'std/fmt/colors.ts';
import { Command } from 'cliffy/command/mod.ts';

import projectTemplate from './templates/project.ts';
import { fetchModuleVersion } from './util.ts';

import info from '../../info.json' assert { type: 'json' };

export const init = new Command()
  .name('init')
  .description('Create a new Compy project')
  .arguments('<name:string>')
  .option('-d --directory <directory:string>', 'Root directory', { required: false })
  .option('-m, --modules <modules:string>', 'Modules directory', { default: 'packages' })
  .option('-c, --config <config:string>', 'Config file', { default: 'deno.json' })
  .option('-i, --import-map <importMap:string>', 'Import map file', { default: 'import_map.json' })
  .action(async ({ directory: maybeRoot, modules, config, importMap }, name) => {
    const root = maybeRoot ?? name;

    const [std] = await Promise.all([
      fetchModuleVersion('std'),
    ]);

    const { directories, files } = projectTemplate({
      name,
      modules,
      config,
      importMap,
      versions: {
        deno: Deno.version.deno,
        compy: info.version,
        std,
      },
    });

    await Deno.mkdir(name);

    await Promise.all(
      directories.map((directory) => Deno.mkdir(resolve(root, directory))),
    );

    await Promise.all(
      Object.entries(files).map(([file, content]) => Deno.writeTextFile(`${root}/${file}`, content)),
    );

    console.log(green(`Created project ${blue(name)}:`));

    const objects = [
      ...directories.map((directory) => `${directory}/`),
      ...Object.keys(files),
    ].sort((left, right) => left.localeCompare(right));

    for (const object of objects) {
      console.log(green('+ ') + object);
    }
  });
