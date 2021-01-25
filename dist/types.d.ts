export declare type DtsImportsPaths = [string, string][];
export interface DtsImportsOptions {
    paths?: {
        [alias: string]: string;
    };
    aliasRoot?: string;
    importPaths?: boolean;
    project?: string;
}
export declare type DtsImportsPathResolver = (declarationPath: string, importPath: string) => string;
