#!/usr/bin/env -S deno run --allow-env --allow-read --allow-run --allow-sys --allow-net --unstable --lock=compy.deno.lock

import compy from './mod.ts';

const [cmd, eggName, ...argv] = Deno.args;

await compy(cmd, eggName, argv);
