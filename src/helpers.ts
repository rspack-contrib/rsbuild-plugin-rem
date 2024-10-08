import type { PluginRemOptions } from './types.js';

type AutoSetRootFontSizeOptions = Omit<PluginRemOptions, 'pxtorem'> & {
  /** expose root font size to global */
  rootFontSizeVariableName: string;
};

export async function getRootPixelCode(
  options: Required<AutoSetRootFontSizeOptions>,
  isCompress = false,
): Promise<string> {
  const code = genJSTemplate(options);

  if (!isCompress) {
    return code;
  }

  const { minify } = await import('terser');
  const { code: minifiedRuntimeCode } = await minify(
    {
      RootPixelCode: code,
    },
    {
      ecma: 5,
    },
  );

  if (!minifiedRuntimeCode) {
    throw new Error(
      '[AutoSetRootFontSizePlugin] Failed to minify runtime code.',
    );
  }

  return minifiedRuntimeCode;
}

export const DEFAULT_OPTIONS: Required<AutoSetRootFontSizeOptions> = {
  enableRuntime: true,
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  rootFontSizeVariableName: 'ROOT_FONT_SIZE',
  excludeEntries: [],
  inlineRuntime: true,
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
};

export const genJSTemplate = (opts: Required<AutoSetRootFontSizeOptions>) => `function setRootPixel() {
  function getQuery(name) {
    return (new RegExp('[?&]' + name + '=([^&#\\b]+)').exec(location.search || '') || [])[1];
  }

  function setRootFontSize() {
    var widthQueryKey = '${opts.widthQueryKey}';
    var rem2px = ${opts.rootFontSize};
    var clientWidth;
    var docEl = document.documentElement;
    if (widthQueryKey && (+getQuery(widthQueryKey))) {
      clientWidth = +getQuery(widthQueryKey);
    } else {
      clientWidth = window.innerWidth && docEl.clientWidth ?
        Math.min(window.innerWidth, docEl.clientWidth) :
        (window.innerWidth || docEl.clientWidth || (document.body && document.body.clientWidth) || ${
          opts.screenWidth
        });
        ${
          opts.supportLandscape
            ? `
        var isLandscape = ((screen.orientation && screen.orientation.angle) || window.orientation) / 90 % 2;
        if (isLandscape) {
          var clientHeight = window.innerHeight && docEl.clientHeight ?
          Math.min(window.innerHeight, docEl.clientHeight) :
          (window.innerHeight || docEl.clientHeight || (document.body && document.body.clientHeight) || ${opts.screenWidth});

          clientWidth = Math.max(clientHeight, 350);
        }`
            : ''
        }
    }

    var htmlFontSizePx = (clientWidth * rem2px) / ${opts.screenWidth};
    var maxRootFontSize = ${opts.maxRootFontSize};

    ${
      opts.useRootFontSizeBeyondMax
        ? 'htmlFontSizePx = htmlFontSizePx < maxRootFontSize ? htmlFontSizePx : rem2px ;'
        : 'htmlFontSizePx = Math.min(htmlFontSizePx, maxRootFontSize);'
    }

    window.${opts.rootFontSizeVariableName} = htmlFontSizePx;
    docEl.style.fontSize = htmlFontSizePx + 'px';
  }

  function adjust(immediate) {
    if (immediate) {
      setRootFontSize();
      return;
    }
    setTimeout(setRootFontSize, 30);
  }

  adjust(true);

  window.addEventListener('resize', adjust, false);

  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', adjust, false);
  }
}

typeof window !== 'undefined' && setRootPixel();`;
