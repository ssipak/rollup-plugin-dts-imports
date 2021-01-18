# rollup-plugin-dts-imports

🍣 A Rollup plugin which fixes imports in *.d.ts declaration files

## Usage

```js
// The plugin has to be included after typescript plugin

import dtsImports from 'rollup-plugin-dts-imports';

export default {
  ...
  plugins: [
    ...
    typescript(),
    ...
    dtsImports(),
    ...
  ]
};
```

## Options

### `aliasRoot`

Type: `string`<br>
Default: `./src`

Root path for all aliases.
If the project source code is in `src` folder
and there are no imports from outside `src`
then the default value will work.

### `importPaths`

Type: `boolean`<br>
Default: `true`

Whether to import paths from tsconfig.json or not

### `project`

Type: `string`<br>
Default: `true`

The path to tsconfig.json

### `paths`

Type: `{ [alias: string]: string }`<br>
Default: `undefined`

Manually specified aliases.
The option is ignored if `importPaths` equals `true`.
