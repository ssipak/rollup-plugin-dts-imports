import path from 'path';
import { isAsset } from './guards';
import { NormalizedOutputOptions, OutputAsset, OutputBundle, PluginContext } from 'rollup';
import { DtsImportsOptions, DtsImportsPaths } from './types';
import ts, {
  isExportDeclaration,
  isImportDeclaration,
  isStringLiteral,
  ParsedCommandLine,
  ScriptTarget
} from 'typescript';
import { convertPathsEntry, prepareAliasNormalizer, relativePath as resolveRelPath, throwDiagnostics } from './utils';

export class DtsImportPlugin {
  private context?: PluginContext;
  private readonly project: string;
  private readonly aliasRoot: string;
  private paths: DtsImportsPaths;
  private readonly importPaths: boolean;
  private normalize: (path: string) => string = x => x;

  public constructor (options: DtsImportsOptions = {}) {
    this.project = options.project ?? './tsconfig.json';
    this.aliasRoot = options.aliasRoot ?? './src';
    this.paths = Object.entries(options.paths ?? {});
    this.importPaths = options.importPaths ?? true;
  }

  public setup (context: PluginContext): void {
    this.context = context;
    this.extractPaths();
    this.normalize = prepareAliasNormalizer(this.paths);
  }

  public generateBundle (options: NormalizedOutputOptions, bundle: OutputBundle): void {
    Object
      .keys(bundle)
      .filter(x => /\.d\.ts$/.test(x))
      .map(x => bundle[x])
      .filter(isAsset)
      .forEach(this.processFile.bind(this));
  }

  private processFile (asset: OutputAsset): void {
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

      const originalPath = moduleSpecifier.text;
      const normalizedPath = this.normalize(originalPath);

      if (normalizedPath === originalPath) {
        return;
      }

      moduleSpecifier.text = resolveRelPath(declarationPath, normalizedPath, true);
    });

    asset.source = ts.createPrinter().printFile(file);
  }

  private extractPaths (): void {
    if (this.importPaths) {
      const tsPaths = this.readTsConfig().options.paths ?? {};
      const paths = Object.entries(tsPaths).map(convertPathsEntry);

      this.paths = this.paths.concat(paths);
    }

    if (this.paths.length === 0) {
      console.warn('Paths\' list is empty');
    }
  }

  private tsConfig?: ParsedCommandLine;

  private readTsConfig (): ParsedCommandLine {
    if (this.tsConfig) {
      return this.tsConfig;
    }

    const configFile = ts.readConfigFile(this.project, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
    throwDiagnostics(compilerOptions);
    return (this.tsConfig = compilerOptions);
  }
}
