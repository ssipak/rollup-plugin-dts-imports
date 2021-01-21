import { Diagnostic, DiagnosticMessageChain, ParsedCommandLine } from 'typescript';
export declare function throwDiagnostics(opts: ParsedCommandLine | Diagnostic | DiagnosticMessageChain | string): void;
export declare function convertPathsEntry([alias, paths]: [string, string[]]): [string, string];
export declare function escapeRegExp(string: string): string;
