import { blue, green } from 'std/fmt/colors.ts';
import { Command } from 'cliffy/command/mod.ts';

import { buildModuleUrl, getCompy } from './util.ts';

export const add = new Command()
  .name('add')
  .description('Add a module alias to import_map.json')
  .arguments('<alias:string> <url:string>')
  .arguments('<name:string> [version:string]')
  .option('-m, --module <module:string>', 'Module name')
  .action(async ({ module }, alias, maybeUrl) => {
    const compy = await getCompy();

    // TODO(danilo-valente): parameterize import map file name
    const IMPORT_MAP = './import_map.json';

    const importMap = JSON.parse(
      await Deno.readTextFile(IMPORT_MAP),
    );

    const url = await buildModuleUrl(alias, maybeUrl);

    if (module) {
      const moduleRoot = `./${compy.config.modules}/${module}`;

      importMap.scopes[moduleRoot] = {
        ...importMap.scopes[moduleRoot] ?? {},
        [`${alias}/`]: url,
      };
    } else {
      importMap.imports[`${alias}/`] = url;
    }

    await Deno.writeTextFile(IMPORT_MAP, JSON.stringify(importMap, null, 2));

    console.log(green(`Added ${blue(alias)} from ${blue(url.toString())}`));
  });
