import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRem } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should not generate runtime code when the entry is excluded', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginRem({
          excludeEntries: ['index'],
        }),
        pluginReact(),
      ],
    },
  });

  await rsbuild.build();

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');
  expect(htmlContent.includes('function setRootPixel')).toBeFalsy();
});
