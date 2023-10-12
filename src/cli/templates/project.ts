import * as toml from 'std/toml/mod.ts';

export type ProjectConfig = {
  name: string;
  modules: string;
  config: string;
  importMap: string;
  versions: {
    std: string;
    compy: string;
  };
};

export default ({ name, modules, config, importMap, versions }: ProjectConfig) => {
  const compyTs = `import { Compy } from 'https://deno.land/x/compy@v${versions.compy}/types.ts';

export default {
  modules: '${modules}',
  config: '${config}',
} satisfies Compy;
`;

  const denoJson = JSON.stringify({
    lint: {
      include: ['**/*.ts'],
      exclude: ['**/fixtures/'],
      rules: {
        tags: ['recommended'],
        include: ['ban-untagged-todo'],
        exclude: ['require-await', 'no-unused-vars'],
      },
    },
    fmt: {
      useTabs: false,
      lineWidth: 120,
      indentWidth: 2,
      semiColons: true,
      singleQuote: true,
      proseWrap: 'preserve',
      include: ['**/*.ts'],
      exclude: ['**/fixtures/'],
    },
    test: {
      include: ['**/spec/'],
    },
    compilerOptions: {
      emitDecoratorMetadata: true,
    },
    importMap: importMap,
  });

  const editorconfig = toml.stringify({
    root: true,
    '*': {
      charset: 'utf-8',
      indent_style: 'space',
      indent_size: 2,
      insert_final_newline: true,
      trim_trailing_whitespace: true,
    },
    '*.md': {
      max_line_length: 'off',
      trim_trailing_whitespace: false,
    },
    '*.ts': {
      quote_type: 'single',
      spaces_around_operators: true,
      spaces_around_brackets: 'inside',
    },
  });

  const vscodeExtensionsJson = JSON.stringify(
    {
      recommendations: ['denoland.vscode-deno'],
    },
    null,
    2,
  );

  const vscodeSettingsJson = JSON.stringify(
    {
      'deno.enable': true,
      'deno.config': config,
      'deno.lint': true,
      'deno.unstable': true,
      'javascript.preferences.quoteStyle': 'single',
      'javascript.format.semicolons': 'insert',
      'typescript.preferences.quoteStyle': 'single',
      'typescript.format.semicolons': 'insert',
      '[typescript]': {
        'editor.defaultFormatter': 'denoland.vscode-deno',
        'editor.formatOnSave': true,
      },
    },
    null,
    2,
  );

  const readmeMd = [
    '![Deno JS](https://img.shields.io/badge/deno%20js-000000?style=for-the-badge&logo=deno&logoColor=white)',
    '',
    `# ${name}`,
  ].join('\n');

  const toolVersions = `deno ${Deno.version.deno}`;

  const importMapJson = JSON.stringify({
    imports: {},
    scopes: {},
  });

  return {
    directories: [
      '.vscode',
      modules,
    ],
    files: {
      '.compy.ts': compyTs,
      [config]: denoJson,
      '.editorconfig': editorconfig,
      'README.md': readmeMd,
      '.tool-versions': toolVersions,
      'import_map.json': importMapJson,
      '.vscode/extensions.json': vscodeExtensionsJson,
      '.vscode/settings.json': vscodeSettingsJson,
    },
  };
};
