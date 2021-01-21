import path from 'path';
import ts, { isExportDeclaration, isImportDeclaration, isStringLiteral, ScriptTarget } from 'typescript';
import { OutputAsset, Plugin } from 'rollup';
import { DtsImportsOptions, DtsImportsPathResolver, DtsImportsPaths } from './types';
import { isAsset } from './guards';
import { escapeRegExp, throwDiagnostics, transformTsPath, validateTsPaths } from './utils';

const PLUGIN_NAME = 'dts-imports';
const DEFAULTS: DtsImportsOptions = {
  project: './tsconfig.json',
  importPaths: true,
  aliasRoot: './src'
};

export function dtsImportsPlugin (pluginOpts: DtsImportsOptions = {}): Plugin {
  pluginOpts = Object.assign({}, DEFAULTS, pluginOpts);

  const { aliasRoot } = pluginOpts;

  if (typeof aliasRoot !== 'string') {
    throw new Error('Option "aliasRoot" must be a string');
  }

  const paths = extractPaths(pluginOpts);

  const resolveFn = prepareResolveFn(paths);

  return {
    name: PLUGIN_NAME,
    generateBundle (options, bundle) {
      Object
        .keys(bundle)
        .filter(x => /\.d\.ts$/.test(x))
        .map(x => bundle[x])
        .filter(isAsset)
        .forEach(process.bind(this)(aliasRoot, resolveFn));
    }
  };
}

function extractPaths (pluginOpts: DtsImportsOptions): DtsImportsPaths {
  let paths: DtsImportsPaths;

  if (pluginOpts.importPaths) {
    if (!pluginOpts.project) {
      throw new Error('Project option has to be a valid path to typescript config');
    }

    const configFile = ts.readConfigFile(pluginOpts.project, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      './'
    );

    throwDiagnostics(compilerOptions);

    const tsPaths = compilerOptions.options.paths ?? {};

    paths = Object.entries(tsPaths).map(([alias, paths]) => {
      validateTsPaths(paths);

      return [
        transformTsPath(alias),
        transformTsPath(paths[0])
      ];
    });
  } else if (pluginOpts.paths) {
    paths = Object.entries(pluginOpts.paths);
  } else {
    throw new Error('Paths weren\'t resolved');
  }

  if (paths.length === 0) {
    console.warn("Paths' list is empty");
  }

  return paths;
}

function prepareResolveFn (paths: DtsImportsPaths): DtsImportsPathResolver {
  if (paths.length === 0) {
    return x => x;
  }

  const SEP = escapeRegExp(path.sep);

  const subFn = paths
    .map(([from, to]) => {
      const pattern = `^${escapeRegExp(from)}(?=${SEP}|$)`;
      const regex = new RegExp(pattern);
      return (str: string) => str.replace(regex, to);
    })
    .reduce((acc, fn) => (str) => fn(acc(str)));

  return (currentFilename, importedFilename) => {
    const substitutedFilename = subFn(importedFilename);
    if (substitutedFilename === importedFilename) {
      return importedFilename;
    }

    let relDir = path.relative(
      path.dirname(currentFilename),
      path.dirname(substitutedFilename)
    );

    if (!path.isAbsolute(relDir) && !relDir.startsWith('.')) {
      relDir = `.${path.sep}${relDir}`;
    }

    return path.format({
      dir: relDir,
      base: path.basename(substitutedFilename)
    });
  };
}

function process (aliasRoot: string, resolveFn: DtsImportsPathResolver) {
  return (asset: OutputAsset) => {
    const file = ts.createSourceFile(asset.fileName, asset.source.toString(), ScriptTarget.Latest);

    const declarationPath = path.join(aliasRoot, asset.fileName);

    file.forEachChild(node => {
      if (!(isImportDeclaration(node) || isExportDeclaration(node))) {
        return;
      }

      const { moduleSpecifier } = node;

      if (!moduleSpecifier) {
        return;
      }

      if (!isStringLiteral(moduleSpecifier)) {
        console.warn('Module specifier is not a string literal');
        return;
      }

      moduleSpecifier.text = resolveFn(declarationPath, moduleSpecifier.text);
    });

    asset.source = ts.createPrinter().printFile(file);
  };
}
