import path from 'node:path';
import {
  type NormalizedEnvironmentConfig,
  type PostCSSPlugin,
  type RsbuildPlugin,
  ensureAssetPrefix,
  logger,
} from '@rsbuild/core';
import deepmerge from 'deepmerge';
import pxToRemPlugin from 'postcss-pxtorem';
import { DEFAULT_OPTIONS, getRootPixelCode } from './helpers.js';
import type { PluginRemOptions } from './types.js';

export type { PluginRemOptions };

export const PLUGIN_REM_NAME = 'rsbuild:rem';

export const pluginRem = (
  userOptions: PluginRemOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REM_NAME,

  setup(api) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...userOptions,
    };

    let scriptPath: string | undefined;
    let runtimeCode: string | undefined;

    const getScriptPath = (distDir: string) => {
      if (!scriptPath) {
        scriptPath = path.posix.join(distDir, `convert-rem.${VERSION}.js`);
      }

      return scriptPath;
    };

    const getRuntimeCode = async (config: NormalizedEnvironmentConfig) => {
      if (!runtimeCode) {
        const isCompress = config.mode === 'production';
        runtimeCode = await getRootPixelCode(options, isCompress);
      }
      return runtimeCode;
    };

    const getPostCSSPlugin = async () => {
      return pxToRemPlugin({
        rootValue: options.rootFontSize,
        unitPrecision: 5,
        propList: ['*'],
        ...(options.pxtorem ? deepmerge({}, options.pxtorem) : {}),
      });
    };

    api.modifyEnvironmentConfig(async (config, { mergeEnvironmentConfig }) => {
      const remPlugin = await getPostCSSPlugin();
      return mergeEnvironmentConfig(config, {
        tools: {
          postcss(_, { addPlugins }) {
            addPlugins(remPlugin as PostCSSPlugin);
          },
        },
      });
    });

    api.processAssets(
      { stage: 'additional' },
      async ({ compilation, environment, sources }) => {
        const { config } = environment;

        if (
          config.output.target !== 'web' ||
          !options.enableRuntime ||
          options.inlineRuntime
        ) {
          return;
        }

        const code = await getRuntimeCode(config);
        const scriptPath = getScriptPath(config.output.distPath.js);
        compilation.emitAsset(scriptPath, new sources.RawSource(code));
      },
    );

    api.modifyHTMLTags(
      async (
        { headTags, bodyTags },
        { environment, filename, assetPrefix },
      ) => {
        if (!options.enableRuntime) {
          return { headTags, bodyTags };
        }

        const entries = Object.keys(environment.entry);
        const { config } = environment;

        const isExclude = options.excludeEntries.find((item: string) => {
          if (!entries.includes(item)) {
            logger.error(`convertToRem: can't find the entryName: ${item}`);
            return false;
          }
          const absolutePath = path.join(api.context.distPath, filename);
          const reg = new RegExp(
            `([/\\\\]${item}[/\\\\]index.html)|([/\\\\]${item}.html)`,
            'gi',
          );
          return reg.test(absolutePath);
        });

        if (isExclude) {
          return { headTags, bodyTags };
        }

        const scriptTag = {
          tag: 'script',
          attrs: {},
        };

        let injectPosition = 0;
        // should inject rem runtime code after meta tags
        headTags.forEach((tag, index) => {
          if (tag.tag === 'meta') {
            injectPosition = index + 1;
          }
        });

        if (options.inlineRuntime) {
          headTags.splice(injectPosition, 0, {
            ...scriptTag,
            children: await getRuntimeCode(config),
          });
        } else {
          const url = ensureAssetPrefix(
            getScriptPath(config.output.distPath.js),
            assetPrefix,
          );

          const attrs: Record<string, string> = {
            ...scriptTag.attrs,
            src: url,
          };

          if (config.html.scriptLoading === 'defer') {
            attrs.defer = '';
          }
          if (config.html.scriptLoading === 'module') {
            attrs.type = 'module';
          }

          headTags.splice(injectPosition, 0, {
            ...scriptTag,
            attrs,
          });
        }

        return {
          headTags,
          bodyTags,
        };
      },
    );
  },
});
