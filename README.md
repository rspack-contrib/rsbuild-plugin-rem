# @rsbuild/plugin-rem

@rsbuild/plugin-rem is a Rsbuild plugin to do something.

<p>
  <a href="https://npmjs.com/package/@rsbuild/plugin-rem">
   <img src="https://img.shields.io/npm/v/@rsbuild/plugin-rem?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## Usage

Install:

```bash
npm add @rsbuild/plugin-rem -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginRem } from "@rsbuild/plugin-rem";

export default {
  plugins: [pluginRem()],
};
```

## Options

### foo

Some description.

- Type: `string`
- Default: `undefined`
- Example:

```js
pluginRem({
  foo: "bar",
});
```

## License

[MIT](./LICENSE).
