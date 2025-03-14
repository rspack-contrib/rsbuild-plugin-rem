# @rsbuild/plugin-rem

<p>
  <a href="https://npmjs.com/package/@rsbuild/plugin-rem">
   <img src="https://img.shields.io/npm/v/@rsbuild/plugin-rem?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

Rem 插件实现移动端页面的 rem 自适应布局，能够根据屏幕大小来动态调整字体大小，让网页在不同大小的屏幕上都能够自适应显示。

插件提供以下能力：

- 集成 [postcss-pxtorem](https://npmjs.com/package/postcss-pxtorem)，将 CSS 中的 `px` 单位转换为 `rem`。
- 在 HTML 模版中插入运行时代码，对根元素 fontSize 进行设置。

## Usage

安装：

```bash
npm add @rsbuild/plugin-rem -D
```

在 `rsbuild.config.ts` 中注册:

```ts
// rsbuild.config.ts
import { pluginRem } from "@rsbuild/plugin-rem";

export default {
  plugins: [pluginRem()],
};
```

## 选项

### 默认选项

```js
const defaultOptions = {
  enableRuntime: true,
  rootFontSize: 50,
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: "",
  excludeEntries: [],
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
  pxtorem: {
    rootValue: 50,
    unitPrecision: 5,
    propList: ["*"],
  },
};
```

### enableRuntime

- **类型：** `boolean`
- **默认值：** `true`

是否自动生成 runtime 代码来动态计算根元素字体大小。

### inlineRuntime

- **类型：** `boolean`
- **默认值：** `true`

是否将 runtime 代码内联到 HTML 文件中。如果设置为 `false`，运行时代码会被抽取为一个独立的 `convert-rem.[version].js` 文件，并输出到产物目录下。

### rootFontSize

- **类型：** `number`
- **默认值：** `50`

根元素字体值。

```js
pluginRem({
  rootFontSize: 30,
});
```

### maxRootFontSize

- **类型：** `number`
- **默认值：** `64`

最大根元素字体值。

### widthQueryKey

- **类型：** `string`
- **默认值：** `''`

根据 `widthQueryKey` 的值去 url query 中取 client width。

### screenWidth

- **类型：** `number`
- **默认值：** `375`

UI 设计图宽度。

### excludeEntries

- **类型：** `string[]`
- **默认值：** `[]`

设置不注入 runtime 代码的页面入口，数组的 item 是页面入口的名称。通常需要配合 `pxtorem.exclude` 使用。

```ts
// rsbuild.config.ts
import { pluginRem } from "@rsbuild/plugin-rem";

export default {
  source: {
    entry: {
      page1: "./src/page1/index.tsx",
      page2: "./src/page2/index.tsx",
    },
  },
  plugins: [
    pluginRem({
      excludeEntries: ["page2"],
    }),
  ],
};
```

### supportLandscape

- **类型：** `boolean`
- **默认值：** `false`

横屏时使用 height 计算 rem。

### useRootFontSizeBeyondMax

- **类型：** `boolean`
- **默认值：** `false`

超过 `maxRootFontSize` 时，是否使用 `rootFontSize`。

### pxtorem

- **类型：** `object`
- **默认值：**
  - `rootValue`：默认与 `rootFontSize` 相同
  - `unitPrecision`：`5`。精确位数
  - `propList`：`['*']`。支持转换的 CSS 属性

用于自定义 [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#options) 插件的选项。

```js
pluginRem({
  pxtorem: {
    propList: ["font-size"],
  },
});
```

## 使用指南

### CSS 属性值转换

由于默认的 rootFontSize 为 50。开启 rem 转换后，会按照 1rem = 50px 的比例，对 CSS 样式做如下转换：

```css
/* input */
h1 {
  margin: 0 0 16px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}

/* output */
h1 {
  margin: 0 0 0.32rem;
  font-size: 0.64rem;
  line-height: 1.2;
  letter-spacing: 0.02rem;
}
```

Rsbuild 默认会对所有 CSS 属性进行转换，如果希望仅对 font-size 属性进行转换，可通过设置 `pxtorem.propList` 实现。

```ts
pluginRem({
  pxtorem: {
    propList: ["font-size"],
  },
});
```

### 如何实现一些 CSS 属性不被转换为 REM？

[pxtorem.propList](https://github.com/cuth/postcss-pxtorem#options) 除了可以指定哪些属性需要被转换外，可以通过 `!` 方式指定哪些元素不被转换：

```ts
pluginRem({
  pxtorem: {
    propList: ["*", "!border-width"], // 不转换 border-width 属性
  },
});
```

如果只希望一些个别 CSS 属性不被转换为 REM 时，也可参考如下写法：

```css
/* `px` 转换为 `rem` */
.convert {
  font-size: 16px; // 转换为 1rem
}

/* `Px` 或 `PX` 会被 `postcss-pxtorem` 忽略，但是可以被浏览器正常识别 */
.ignore {
  border: 1px solid; // 忽略
  border-width: 2px; // 忽略
}
```

更多信息可参考 [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#a-message-about-ignoring-properties)。

### 根元素字体大小计算

页面根元素的字体大小的计算公式为：

```
根元素字体大小 = 当前客户端屏幕宽度  * 根元素字体值 / UI 设计图宽度

(即：pageRootFontSize = clientWidth * rootFontSize / screenWidth)
```

以屏幕宽度为 390 的手机端浏览器为例，根元素字体值的默认值为 50， UI 设计图宽度为 375。

此时计算出的页面根元素的字体大小为 52 (`390 * 50 / 375`)。
此时 1 rem 为 52px，CSS 样式中的 32px（0.64 rem），实际页面效果为 33.28 px。

```ts
pluginRem({
  rootFontSize: 50,
  screenWidth: 375,
});
```

### 设置根元素字体最大值

在桌面浏览器端，根据计算公式得到的页面根元素字体值往往过大，当计算出的结果超出了默认的最大根元素字体值时，则采用当前设置的最大根元素字体值为当前根元素字体值。

以屏幕宽度为 1920 的桌面浏览器为例，此时计算出的根元素的字体大小为 349，超出了最大根元素字体值 64。则采用 64 为当前的根元素字体值。

```ts
pluginRem({
  maxRootFontSize: 64,
});
```

### 如何获取页面实际生效的 rootFontSize 值？

页面实际生效的 rootFontSize 会根据当前页面的情况动态计算。你可以通过打印 `document.documentElement.style.fontSize` 查看，也可通过 `window.ROOT_FONT_SIZE` 获取。

### 如何指定页面实际生效的 rootFontSize 值？

默认情况下，页面实际生效的 rootFontSize 会根据当前页面的情况动态计算，如果希望指定页面实际生效的 rootFontSize，可关闭 `enableRuntime` 配置，并在[自定义 HTML 模版](/config/html/template) 中自行注入 `document.documentElement.style.fontSize = '64px'`。

```ts
export default {
  html: {
    template: "./static/index.html",
  },
  plugins: [
    pluginRem({
      enableRuntime: false,
    }),
  ],
};
```

### 如何判断 REM 是否生效？

1. CSS：查看生成的 `.css` 文件中对应属性的值是否从 px 转换成 rem。
2. HTML：打开页面控制台查看 `document.documentElement.style.fontSize` 是否存在有效值。

## License

[MIT](./LICENSE).
