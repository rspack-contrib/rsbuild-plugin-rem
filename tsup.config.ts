import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsup';

const pkgJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8'),
);

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
  define: {
    VERSION: JSON.stringify(pkgJson.version),
  },
});
