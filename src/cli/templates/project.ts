import { join } from 'std/path/join.ts';
import * as toml from 'std/toml/mod.ts';

export type ProjectConfig = {
  name: string;
  modules: string;
  config: string;
  importMap: string;
  versions: {
    deno: string;
    compy: string;
    std: string;
  };
};

const encodeJson = (json: unknown) => JSON.stringify(json, null, 2);

export default ({ name, modules, config, importMap, versions }: ProjectConfig) => {
  const compyTs = `import { Compy } from 'https://deno.land/x/compy@v${versions.compy}/types.ts';

export default {
  name: '${name}',
  modules: '${modules}',
  config: '${config}',
} satisfies Compy;
`;

  const denoJson = encodeJson({
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

  const vscodeExtensionsJson = encodeJson({
    recommendations: ['denoland.vscode-deno'],
  });

  const vscodeSettingsJson = encodeJson({
    'deno.enable': true,
    'deno.config': config,
    'deno.lint': true,
    'deno.unstable': true,
    'editor.defaultFormatter': 'denoland.vscode-deno',
    'javascript.preferences.quoteStyle': 'single',
    'javascript.format.semicolons': 'insert',
    'typescript.preferences.quoteStyle': 'single',
    'typescript.format.semicolons': 'insert',
    '[typescript]': {
      'editor.defaultFormatter': 'denoland.vscode-deno',
      'editor.formatOnSave': true,
    },
    '[typescriptreact]': {
      'editor.defaultFormatter': 'denoland.vscode-deno'
    },
    '[javascriptreact]': {
      'editor.defaultFormatter': 'denoland.vscode-deno'
    },
    '[javascript]': {
      'editor.defaultFormatter': 'denoland.vscode-deno'
    }
  });

  const readmeMd = [
    '![Deno JS](https://img.shields.io/badge/deno%20js-000000?style=for-the-badge&logo=deno&logoColor=white)',
    '',
    `# ${name}`,
  ].join('\n');

  const toolVersions = `deno ${versions.deno}`;

  const importMapJson = encodeJson({
    imports: {
      'std/': `https://deno.land/std@v${versions.std}/`,
    },
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
      [join(modules, '.gitkeep')]: '',
      '.editorconfig': editorconfig,
      'README.md': readmeMd,
      '.tool-versions': toolVersions,
      [importMap]: importMapJson,
      [join('.vscode', 'extensions.json')]: vscodeExtensionsJson,
      [join('.vscode', 'settings.json')]: vscodeSettingsJson,
    },
  };
};
