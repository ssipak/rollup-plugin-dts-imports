import { Diagnostic, DiagnosticMessageChain, ParsedCommandLine } from 'typescript';
import path from 'path';
import { DtsImportsPaths } from './types';

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

function validateTsPaths (paths: string[]): void {
  if (paths.length !== 1) {
    throw new Error(
      'Plugin doesn\'t support multiple paths for single alias'
    );
  }
}

function transformTsPath (path: string): string {
  return path.replace(/\/\*$/, '');
}

export function convertPathsEntry ([alias, paths]: [string, string[]]): [string, string] {
  validateTsPaths(paths);

  return [
    transformTsPath(alias),
    transformTsPath(paths[0])
  ];
}

export function escapeRegExp (string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function relativePath (fromFile: string, toFile: string, prependWithDot: boolean): string {
  let relDir = path.relative(
    path.dirname(fromFile),
    path.dirname(toFile)
  );

  if (prependWithDot && !path.isAbsolute(relDir) && !relDir.startsWith('.')) {
    relDir = `.${path.sep}${relDir}`;
  }

  return path.format({
    dir: relDir,
    base: path.basename(toFile)
  });
}

export function prepareAliasNormalizer (paths: DtsImportsPaths): (path: string) => string {
  if (paths.length === 0) {
    return x => x;
  }

  const SEP = escapeRegExp(path.sep);

  return paths
    .map(([from, to]) => {
      const pattern = `^${escapeRegExp(from)}(?=${SEP}|$)`;
      const regex = new RegExp(pattern);
      return (str: string) => str.replace(regex, to);
    })
    .reduce((acc, fn) => (str) => fn(acc(str)));
}
