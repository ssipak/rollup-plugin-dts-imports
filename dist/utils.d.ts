import { Diagnostic, DiagnosticMessageChain, ParsedCommandLine } from 'typescript';
import { DtsImportsPaths } from './types';
export declare function throwDiagnostics(opts: ParsedCommandLine | Diagnostic | DiagnosticMessageChain | string): void;
export declare function convertPathsEntry([alias, paths]: [string, string[]]): [string, string];
export declare function escapeRegExp(string: string): string;
export declare function relativePath(fromFile: string, toFile: string, prependWithDot: boolean): string;
export declare function prepareAliasNormalizer(paths: DtsImportsPaths): (path: string) => string;
