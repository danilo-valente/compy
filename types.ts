export type CompyShell = {
  default: Compy;
};

export type Compy = {
  nests?: string;
  config?: string;
};

// Reference: https://deno.land/manual@v1.36.3/basics/permissions#permissions-list
export type Permissions = {
  env: PermissionScope;
  sys: PermissionScope<SysPermission>;
  hrtime: PermissionScope<never>;
  net: PermissionScope;
  ffi: PermissionScope;
  read: PermissionScope;
  run: PermissionScope;
  write: PermissionScope;
};

export type PermissionScope<T = string> = boolean | T | T[];

export type SysPermission =
  | 'hostname'
  | 'osRelease'
  | 'osUptime'
  | 'loadavg'
  | 'networkInterfaces'
  | 'systemMemoryInfo'
  | 'uid'
  | 'gid';

export type PermissionFlags = keyof Permissions | (keyof Permissions)[] | Partial<Permissions>;

export type Embryo<T = Flags.All> = {
  entry: string;
  args: string[];
  env: Record<string, string>;
} & T;

// TODO(danilo-valente): check flag support mapping
export namespace Embryos {
  // TODO(danilo-valente): add support for all flags
  export type Lint = Embryo<Flags.Compilation>;

  // TODO(danilo-valente): add support for all flags
  export type Fmt = Embryo<Flags.Watch | Flags.Compilation>;

  // TODO(danilo-valente): add support for all flags
  export type Cache = Embryo<Flags.Compilation | Flags.Lock>;

  // TODO(danilo-valente): add support for all flags
  export type Test = Embryo<Flags.Watch | Flags.Lock | Flags.Compilation | Flags.Runtime>;

  // TODO(danilo-valente): add support for all flags
  export type Run = Embryo<Flags.Watch | Flags.Lock | Flags.Compilation | Flags.Runtime>;
};

export namespace Flags {
  export type All = Lock & Watch & Compilation & Runtime;

  export type Lock = {
    lock?: string;
    lockWrite?: boolean;
  };

  export type Watch = {
    watch?: boolean;
  };

  export type Compilation = {
    config?: string;
    importMap?: string;
    noRemote?: boolean;
    reload?: boolean | string;
    unstable?: boolean;
  };

  export type Runtime = {
    allow?: PermissionFlags | true;
    deny?: PermissionFlags;
    check?: boolean;
    inspect?: string | [string, number];
    inspectBrk?: string | [string, number];
    inspectWait?: string | [string, number];
    location?: string;
    prompt?: boolean;
    seed?: number;
    v8Flags?: string;
  }
}

// TODO(danilo-valente): add support for other commands: bench, check, compile, doc, eval, repl
export type NativeCmd = 'cache' | 'test' | 'fmt' | 'lint';
export type RunCmd = 'start' | 'dev';

export type Cmd = NativeCmd | RunCmd;

export type Entry = string;

export type Egg = Partial<
  {
    entry: Entry;
    cache: Entry | Partial<Embryos.Cache>;
    test: Entry | Partial<Embryos.Test>;
    fmt: Entry | Partial<Embryos.Fmt>;
    lint: Entry | Partial<Embryos.Lint>;
    start: Entry | Partial<Embryos.Run>;
    dev: Entry | Partial<Embryos.Run>;
    ext: Record<string, string | Embryo<never>>;
  }
  & Flags.All
>;

export type EggShell = { default: Egg };
