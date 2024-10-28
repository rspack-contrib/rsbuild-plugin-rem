import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRem } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should not generate runtime code when enableRuntime is false', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginRem({
          enableRuntime: false,
        }),
        pluginReact(),
      ],
    },
  });

  await rsbuild.build();

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');

  const { version } = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
  );
  const remFile = join(
    rsbuild.context.distPath,
    `static/js/convert-rem.${version}.js`,
  );

  expect(existsSync(remFile)).toBeFalsy();
  expect(htmlContent.includes('function setRootPixel')).toBeFalsy();
});
