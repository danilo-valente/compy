import { Command } from '../../deps/cliffy.ts';
import { blue, green, resolve } from '../../deps/std.ts';

import { Compy } from '../compy.ts';

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
  const importMapPath = compy.denoConfig.config.importMap;

  const importMap = JSON.parse(
    await Deno.readTextFile(importMapPath),
  );

  const moduleRoot = `./${compy.config.modules}/${module}/`;

  const alias = compy.config.aliasFn(module);
  const target = `${moduleRoot}src/`;

  importMap.imports[alias] = target;
  importMap.scopes[moduleRoot] = { '../': target };

  await Deno.writeTextFile(importMapPath, JSON.stringify(importMap, null, 2));
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
