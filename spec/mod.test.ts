Deno.test('import monorepo', async () => {
  await import('../src/monorepo.ts');
});

Deno.test('import cli', async () => {
  await import('../src/cli/mod.ts');
});
