import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@support-ticket/shared'],
  external: ['better-sqlite3', 'express', 'cors', 'helmet', 'zod'],
});
