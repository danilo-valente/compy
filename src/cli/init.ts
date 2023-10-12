import { blue, green } from 'std/fmt/colors.ts';
import { Command } from 'cliffy/command/mod.ts';

import projectTemplate from './templates/project.ts';

import info from '../../info.json' assert { type: 'json' };

const getLatestVersion = async (module: string) => {
  const response = await fetch(`https://apiland.deno.dev/v2/modules/${module}`);

  const { latest_version } = await response.json();

  return latest_version;
};

export const init = new Command()
  .name('init')
  .description('Create a new Compy project')
  .arguments('<project:string>')
  .option('-m, --modules <modules:string>', 'Modules directory', { default: 'packages' })
  .option('-c, --config <config:string>', 'Config file', { default: 'deno.json' })
  .option('-i, --import-map <importMap:string>', 'Import map file', { default: 'import_map.json' })
  .action(async ({ modules, config, importMap }, project) => {
    const [std] = await Promise.all([
      getLatestVersion('std'),
    ]);

    const { directories, files } = projectTemplate({
      name: project,
      modules,
      config,
      importMap,
      versions: {
        std,
        compy: info.version,
      },
    });

    await Deno.mkdir(project);

    await Promise.all(
      directories.map((directory) => Deno.mkdir(`${project}/${directory}`)),
    );

    await Promise.all(
      Object.entries(files).map(([file, content]) => Deno.writeTextFile(`${project}/${file}`, content)),
    );

    console.log(green(`Created project ${blue(project)}:`));

    const objects = [
      ...directories.map((directory) => `${directory}/`),
      ...Object.keys(files),
    ].sort((left, right) => left.localeCompare(right));

    for (const object of objects) {
      console.log(green('+ ') + object);
    }
  });
