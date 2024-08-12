import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginRem } from '../../dist';

const viewportValue =
  'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should inject rem runtime code after meta tags', async () => {
  const remRuntimeCodeKeyWord = 'setRootPixel';

  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginRem()],
      html: {
        meta: {
          viewport: viewportValue,
        },
      },
    },
  });

  await rsbuild.build();

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');

  expect(htmlContent).toContain(remRuntimeCodeKeyWord);
  expect(htmlContent).toContain(viewportValue);
  expect(htmlContent.indexOf(remRuntimeCodeKeyWord)).toBeGreaterThan(
    htmlContent.indexOf(viewportValue),
  );
});
