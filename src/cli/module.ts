import { resolve } from 'std/path/resolve.ts';
import { blue, green } from 'std/fmt/colors.ts';
import { Command } from 'cliffy/command/mod.ts';

import { Compy } from '~/compy.ts';

import moduleTemplate from './templates/module.ts';
import { getCompy, getEggs } from './util.ts';

import info from '../../info.json' assert { type: 'json' };

const list = async () => {
  const eggs = await getEggs();

  for (const egg of eggs) {
    console.log(egg);
  }
};

const addToImportMap = async (module: string, compy: Compy) => {
  // TODO(danilo-valente): parameterize import map file name
  const IMPORT_MAP = './import_map.json';

  const importMap = JSON.parse(
    await Deno.readTextFile(IMPORT_MAP),
  );

  const moduleRoot = `./${compy.config.modules}/${module}`;

  importMap.imports[`@${module}/`] = `${moduleRoot}/src/`;
  importMap.scopes[moduleRoot] = {
    '~/': `${moduleRoot}/src/`,
  };

  await Deno.writeTextFile(IMPORT_MAP, JSON.stringify(importMap, null, 2));
};

const create = async (module: string) => {
  const compy = await getCompy();

  const { directories, files } = moduleTemplate({
    name: module,
    versions: {
      deno: Deno.version.deno,
      compy: info.version,
    },
  });

  const nest = resolve(compy.nests, module);

  await Deno.mkdir(nest);

  await Promise.all(
    directories.map((directory) => Deno.mkdir(resolve(nest, directory))),
  );

  await Promise.all(
    Object.entries(files).map(
      ([file, content]) => Deno.writeTextFile(resolve(nest, file), content),
    ),
  );

  await addToImportMap(module, compy);

  console.log(green(`Created module ${blue(module)}:`));

  const objects = [
    ...directories.map((directory) => `${directory}/`),
    ...Object.keys(files),
  ].sort((left, right) => left.localeCompare(right));

  for (const object of objects) {
    console.log(green('+ ') + object);
  }
};

export const mod = new Command()
  .name('mod')
  .description('List or create module')
  .arguments('[module:string]')
  .action(async (_options, module) => {
    if (module) {
      await create(module);
    } else {
      await list();
    }
  });
