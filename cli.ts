#!/usr/bin/env -S deno run --allow-env --allow-read --allow-run --allow-sys --allow-net --unstable --lock=compy.deno.lock

import compy from './mod.ts';
import { Cmd } from './types.ts';

const [cmd, eggName, ...argv] = Deno.args;

// FIXME: provide proper type check
await compy(cmd as Cmd, eggName, argv);
