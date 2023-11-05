import { Command } from '../../deps/cliffy.ts';
import { blue, green } from '../../deps/std.ts';

import { buildDenoLandUrl, getCompy, UrlType } from './util.ts';

export const add = new Command()
  .name('add')
  .description('Add a module alias to import map')
  .type('url', new UrlType())
  .arguments('<name:string> [version:string]')
  .option('-m, --module <module:string>', 'Module name')
  .option('-u, --url <url:url>', 'Source URL')
  .action(async ({ module: maybeModule, url: maybeUrl }, name, maybeVersion) => {
    const compy = await getCompy();

    const importMapPath = compy.denoConfig.config.importMap;

    const importMap = JSON.parse(
      await Deno.readTextFile(importMapPath),
    );

    const url = await buildDenoLandUrl({ name, maybeVersion, maybeUrl });

    if (maybeModule) {
      const moduleRoot = `./${compy.config.modules}/${maybeModule}/`;

      importMap.scopes[moduleRoot] = {
        ...importMap.scopes[moduleRoot] ?? {},
        [name]: url,
      };
    } else {
      importMap.imports[name] = url;
    }

    await Deno.writeTextFile(importMapPath, JSON.stringify(importMap, null, 2));

    console.log(green(`Added ${blue(name)} from ${blue(url.toString())}`));
  });
