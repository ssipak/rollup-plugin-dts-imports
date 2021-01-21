import ts, { ScriptTarget, isImportDeclaration, isExportDeclaration, isStringLiteral } from 'typescript';
import path from 'path';

function isAsset(e) {
    return e.type === 'asset';
}

function throwDiagnostics(opts) {
    var _a;
    if (typeof opts === 'string') {
        if (opts) {
            throw new Error(opts);
        }
        return;
    }
    if ('messageText' in opts) {
        return throwDiagnostics(opts.messageText);
    }
    return throwDiagnostics((_a = opts.errors[0]) !== null && _a !== void 0 ? _a : '');
}
function validateTsPaths(paths) {
    if (paths.length !== 1) {
        throw new Error('Plugin doesn\'t support multiple paths for single alias');
    }
}
function transformTsPath(path) {
    return path.replace(/\/\*$/, '');
}
function convertPathsEntry([alias, paths]) {
    validateTsPaths(paths);
    return [
        transformTsPath(alias),
        transformTsPath(paths[0])
    ];
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class DtsImportPlugin {
    constructor(options = {}) {
        var _a, _b, _c, _d;
        this.resolver = (d, i) => i;
        this.project = (_a = options.project) !== null && _a !== void 0 ? _a : './tsconfig.json';
        this.aliasRoot = (_b = options.aliasRoot) !== null && _b !== void 0 ? _b : '.src';
        this.paths = Object.entries((_c = options.paths) !== null && _c !== void 0 ? _c : {});
        this.importPaths = (_d = options.importPaths) !== null && _d !== void 0 ? _d : true;
    }
    setup(context) {
        this.context = context;
        this.extractPaths();
        this.prepareResolver();
    }
    generateBundle(options, bundle) {
        Object
            .keys(bundle)
            .filter(x => /\.d\.ts$/.test(x))
            .map(x => bundle[x])
            .filter(isAsset)
            .forEach(this.processFile.bind(this));
    }
    prepareResolver() {
        const SEP = escapeRegExp(path.sep);
        const subFn = this.paths
            .map(([from, to]) => {
            const pattern = `^${escapeRegExp(from)}(?=${SEP}|$)`;
            const regex = new RegExp(pattern);
            return (str) => str.replace(regex, to);
        })
            .reduce((acc, fn) => (str) => fn(acc(str)));
        this.resolver = (currentFilename, importedFilename) => {
            const substitutedFilename = subFn(importedFilename);
            if (substitutedFilename === importedFilename) {
                return importedFilename;
            }
            let relDir = path.relative(path.dirname(currentFilename), path.dirname(substitutedFilename));
            if (!path.isAbsolute(relDir) && !relDir.startsWith('.')) {
                relDir = `.${path.sep}${relDir}`;
            }
            return path.format({
                dir: relDir,
                base: path.basename(substitutedFilename)
            });
        };
    }
    processFile(asset) {
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
    extractPaths() {
        var _a;
        if (this.importPaths) {
            const configFile = ts.readConfigFile(this.project, ts.sys.readFile);
            const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
            throwDiagnostics(compilerOptions);
            const tsPaths = (_a = compilerOptions.options.paths) !== null && _a !== void 0 ? _a : {};
            const paths = Object.entries(tsPaths).map(convertPathsEntry);
            this.paths = this.paths.concat(paths);
        }
        if (this.paths.length === 0) {
            console.warn("Paths' list is empty");
        }
    }
}

const PLUGIN_NAME = 'dts-imports';
function dtsImportsPlugin(pluginOpts = {}) {
    let instance;
    return {
        name: PLUGIN_NAME,
        buildStart() {
            instance = new DtsImportPlugin(pluginOpts);
            instance.setup(this);
        },
        generateBundle(options, bundle) {
            instance.generateBundle(options, bundle);
        }
    };
}

export { dtsImportsPlugin };
