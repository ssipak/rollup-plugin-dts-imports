export type DtsImportsPaths = [string, string][]

export interface DtsImportsOptions {
    paths?: { [alias: string]: string }
    aliasRoot?: string
    importPaths?: boolean
    project?: string
    debug?: boolean
}

export type DtsImportsPathResolver = (declarationPath: string, importPath: string) => string
