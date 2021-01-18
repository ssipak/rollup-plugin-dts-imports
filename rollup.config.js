import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolvePlugin from '@rollup/plugin-node-resolve';
import commonjsPlugin from '@rollup/plugin-commonjs';
import tsPlugin from 'rollup-plugin-typescript2';
import delPlugin from 'rollup-plugin-delete';
import packageJson from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      format: 'cjs',
      file: packageJson.main
    },
    {
      format: 'esm',
      file: packageJson.module
    }
  ],
  plugins: [
    delPlugin({ targets: 'dist/*' }),
    peerDepsExternal(),
    resolvePlugin(),
    commonjsPlugin(),
    tsPlugin(),
  ]
};
