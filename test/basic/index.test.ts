import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRem } from '../../dist';
import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should convert rem unit correctly', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginRem(), pluginReact()],
      server: {
        port: getRandomPort(),
      },
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();
  await page.goto(urls[0]);

  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');

  // less convert pxToRem
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '25.6px');

  // scss convert pxToRem
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '25.6px');

  // css convert pxToRem
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await server.close();
});

test('should inline runtime code to html by default', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginRem(), pluginReact()],
    },
  });

  await rsbuild.build();

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');

  expect(htmlContent.includes('function setRootPixel')).toBeTruthy();
});

test('should extract runtime code when inlineRuntime is false', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginRem({
          inlineRuntime: false,
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
  const remContent = readFileSync(remFile, 'utf-8');

  expect(remContent).toBeTruthy();
  expect(htmlContent.includes('function setRootPixel')).toBeFalsy();
});

test('should apply crossorigin to rem runtime script', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginRem({
          inlineRuntime: false,
        }),
        pluginReact(),
      ],
      server: {
        port: getRandomPort(),
      },
      html: {
        crossorigin: 'use-credentials',
      },
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();
  await page.goto(urls[0]);

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');

  expect(htmlContent).toMatch(
    /<script src="\/static\/js\/convert-rem.\d+\.\d+\.\d+(?:-(beta|alpha|rc)\.\d+)?.js" defer="" crossorigin="use-credentials">/,
  );
  expect(htmlContent.includes('function setRootPixel')).toBeFalsy();

  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await server.close();
});

test('should apply html.scriptLoading to rem runtime script', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginRem({
          inlineRuntime: false,
        }),
        pluginReact(),
      ],
      server: {
        port: getRandomPort(),
      },
      html: {
        scriptLoading: 'module',
      },
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();
  await page.goto(urls[0]);

  const htmlFile = join(rsbuild.context.distPath, 'index.html');
  const htmlContent = readFileSync(htmlFile, 'utf-8');

  expect(htmlContent).toMatch(
    /<script src="\/static\/js\/convert-rem.\d+\.\d+\.\d+(?:-(beta|alpha|rc)\.\d+)?.js" type="module">/,
  );
  expect(htmlContent.includes('function setRootPixel')).toBeFalsy();

  const root = page.locator('html');
  await expect(root).toHaveCSS('font-size', '64px');
  const description = page.locator('#description');
  await expect(description).toHaveCSS('font-size', '20.48px');

  await server.close();
});
