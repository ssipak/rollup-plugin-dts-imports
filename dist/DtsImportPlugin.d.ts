import { NormalizedOutputOptions, OutputBundle, PluginContext } from 'rollup';
import { DtsImportsOptions } from './types';
export declare class DtsImportPlugin {
    private context?;
    private readonly project;
    private readonly aliasRoot;
    private paths;
    private readonly importPaths;
    private resolver;
    constructor(options?: DtsImportsOptions);
    setup(context: PluginContext): void;
    generateBundle(options: NormalizedOutputOptions, bundle: OutputBundle): void;
    private prepareResolver;
    private processFile;
    private extractPaths;
}
