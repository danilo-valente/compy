import { Command, Confirm, Input } from '../../deps/cliffy.ts';
import { blue, green, resolve, white } from '../../deps/std.ts';

import projectTemplate from './templates/project.ts';
import { fetchModuleVersion } from './util.ts';

import info from '../../info.json' assert { type: 'json' };

type InitArgs = {
  name: string;
  root: string;
  modules: string;
  config: string;
  importMap: string;
};

const initProject = async ({ name, root, modules, config, importMap }: InitArgs) => {
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

  await Deno.mkdir(root);

  await Promise.all(
    directories.map((directory) => Deno.mkdir(resolve(root, directory))),
  );

  await Promise.all(
    Object.entries(files).map(([file, content]) => Deno.writeTextFile(`${root}/${file}`, content)),
  );

  console.log(`Created project ${white(name)}:`);

  const plus = green('+');

  console.log(`${plus} ${root}/`);

  const objects = [
    ...directories.map((directory) => `  ${directory}/`),
    ...Object.keys(files).map((file) => `  ${file}`),
  ].sort((left, right) => left.localeCompare(right));

  for (const object of objects) {
    console.log(`${plus} ${object}`);
  }
};

export const init = new Command()
  .name('init')
  .description('Create a new Compy project')
  .arguments('[name:string]')
  .option('-d --directory <directory:string>', 'Root directory')
  .option('-m, --modules <modules:string>', 'Modules directory')
  .option('-c, --config <config:string>', 'Config file')
  .option('-i, --import-map <importMap:string>', 'Import map file')
  .option('-y, --yes', 'Skip prompts')
  .action(async (options, maybeName) => {
    const name = maybeName ?? await Input.prompt('Project name');

    const defaults = {
      directory: name,
      modules: 'packages',
      config: 'deno.json',
      importMap: 'import_map.json',
    };

    const prompt = (option: keyof typeof defaults, message: string) =>
      options[option] ?? (
        options.yes ? defaults[option] : Input.prompt({
          message,
          default: defaults[option],
        })
      );

    const root = await prompt('directory', 'Root directory');

    const modules = await prompt('modules', 'Modules directory');

    const config = await prompt('config', 'Config file');

    const importMap = await prompt('importMap', 'Import map file');

    const confirmation = options.yes || await Confirm.prompt({
      message: `Create project ${blue(name)} in ${blue(root)}?`,
      default: true,
    });

    if (confirmation) {
      await initProject({ name, root, modules, config, importMap });
    }
  });
