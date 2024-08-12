import { defineConfig } from '@rsbuild/core';
import { pluginRem } from '../src';

export default defineConfig({
  plugins: [pluginRem()],
});
