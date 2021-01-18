import { Diagnostic, DiagnosticMessageChain, ParsedCommandLine } from 'typescript';

export function throwDiagnostics (opts: ParsedCommandLine | Diagnostic | DiagnosticMessageChain | string): void {
  if (typeof opts === 'string') {
    if (opts) {
      throw new Error(opts);
    }
    return;
  }

  if ('messageText' in opts) {
    return throwDiagnostics(opts.messageText);
  }

  return throwDiagnostics(opts.errors[0] ?? '');
}

export function validateTsPaths (paths: string[]): void {
  if (paths.length !== 1) {
    throw new Error(
      'Plugin doesn\'t support multiple paths for single alias'
    );
  }
}

export function transformTsPath (path: string): string {
  return path.replace(/\/\*$/, '');
}

export function escapeRegExp (string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
