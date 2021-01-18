import { Diagnostic, DiagnosticMessageChain, ParsedCommandLine } from 'typescript';
export declare function throwDiagnostics(opts: ParsedCommandLine | Diagnostic | DiagnosticMessageChain | string): void;
export declare function validateTsPaths(paths: string[]): void;
export declare function transformTsPath(path: string): string;
export declare function escapeRegExp(string: string): string;
