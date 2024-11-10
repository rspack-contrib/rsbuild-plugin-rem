import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@rslib/core';

const pkgJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8'),
);

export default defineConfig({
  lib: [
    { format: 'esm', syntax: 'es2021', dts: true },
    { format: 'cjs', syntax: 'es2021' },
  ],
  source: {
    define: {
      VERSION: JSON.stringify(pkgJson.version),
    },
  },
  output: {
    target: 'node',
  },
});
