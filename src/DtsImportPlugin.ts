import { isAsset } from './guards';
import { NormalizedOutputOptions, OutputAsset, OutputBundle, PluginContext } from 'rollup';
import { DtsImportsOptions, DtsImportsPathResolver, DtsImportsPaths } from './types';
import ts, { isExportDeclaration, isImportDeclaration, isStringLiteral, ScriptTarget } from 'typescript';
import path from 'path';
import { convertPathsEntry, escapeRegExp, throwDiagnostics } from './utils';

export class DtsImportPlugin {
  private context?: PluginContext;
  private readonly project: string;
  private readonly aliasRoot: string;
  private paths: DtsImportsPaths
  private readonly importPaths: boolean;
  private resolver: DtsImportsPathResolver = (d, i) => i

  public constructor (options: DtsImportsOptions = {}) {
    this.project = options.project ?? './tsconfig.json';
    this.aliasRoot = options.aliasRoot ?? './src';
    this.paths = Object.entries(options.paths ?? {});
    this.importPaths = options.importPaths ?? true;
  }

  public setup (context: PluginContext): void {
    this.context = context;
    this.extractPaths();
    this.prepareResolver();
  }

  public generateBundle (options: NormalizedOutputOptions, bundle: OutputBundle): void {
    Object
      .keys(bundle)
      .filter(x => /\.d\.ts$/.test(x))
      .map(x => bundle[x])
      .filter(isAsset)
      .forEach(this.processFile.bind(this));
  }

  private prepareResolver (): void {
    const SEP = escapeRegExp(path.sep);

    const subFn = this.paths
      .map(([from, to]) => {
        const pattern = `^${escapeRegExp(from)}(?=${SEP}|$)`;
        const regex = new RegExp(pattern);
        return (str: string) => str.replace(regex, to);
      })
      .reduce((acc, fn) => (str) => fn(acc(str)));

    this.resolver = (currentFilename, importedFilename) => {
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

  private processFile (asset: OutputAsset) {
    const file = ts.createSourceFile(asset.fileName, asset.source.toString(), ScriptTarget.Latest);

    const declarationPath = path.join(this.aliasRoot, asset.fileName);

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

      moduleSpecifier.text = this.resolver(declarationPath, moduleSpecifier.text);
    });

    asset.source = ts.createPrinter().printFile(file);
  }

  private extractPaths (): void {
    if (this.importPaths) {
      const configFile = ts.readConfigFile(this.project, ts.sys.readFile);
      const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');

      throwDiagnostics(compilerOptions);

      const tsPaths = compilerOptions.options.paths ?? {};
      const paths = Object.entries(tsPaths).map(convertPathsEntry);

      this.paths = this.paths.concat(paths);
    }

    if (this.paths.length === 0) {
      console.warn("Paths' list is empty");
    }
  }
}
