import { Plugin } from 'rollup';
import { DtsImportsOptions } from './types';
import { DtsImportPlugin } from './DtsImportPlugin';

const PLUGIN_NAME = 'dts-imports';

export function dtsImportsPlugin (pluginOpts: DtsImportsOptions = {}): Plugin {
  let instance: DtsImportPlugin;

  return {
    name: PLUGIN_NAME,
    buildStart () {
      instance = new DtsImportPlugin(pluginOpts);
      instance.setup(this);
    },
    generateBundle (options, bundle) {
      instance.generateBundle(options, bundle);
    }
  };
}
