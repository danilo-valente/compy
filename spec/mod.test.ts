Deno.test('import monorepo', async () => {
  await import('~/monorepo.ts');
});

Deno.test('import cli', async () => {
  await import('~/cli/mod.ts');
});
