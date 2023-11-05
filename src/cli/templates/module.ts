import { join } from '../../../deps/std.ts';

export type ModuleConfig = {
  name: string;
  versions: {
    deno: string;
    compy: string;
  };
};

export default ({ name, versions }: ModuleConfig) => {
  const compyEggTs = `import { Egg } from 'https://deno.land/x/compy@v${versions.compy}/types.ts';

export default {
  entry: './src/mod.ts',

  dev: {
    env: {
      ENV_TYPE: 'development',
    },
  },
  test: {
    entry: 'spec/',
    env: {
      ENV_TYPE: 'test',
    },
  },
  fmt: 'src/',
  lint: 'src/',
} satisfies Egg;
`;

  const dockerfile = `FROM denoland/deno:alpine-${versions.deno}

EXPOSE 3000

WORKDIR /app

ADD . .

RUN deno install --unstable -Ar -n compy -f 'https://deno.land/x/compy@v${versions.compy}/run.ts'

# Cache the main app so that it doesn't need to be cached on each startup/entry.
RUN compy cache ${name}

RUN compy start -e ash ${name} > compy.sh && chmod +x compy.sh

CMD ["./compy.sh"]
`;

  const srcModTs = `console.log('Hello, world!')`;

  return {
    directories: [
      'src',
      'spec',
    ],
    files: {
      '.compy.egg.ts': compyEggTs,
      [join('src', 'mod.ts')]: srcModTs,
      'Dockerfile': dockerfile,
    },
  };
};
