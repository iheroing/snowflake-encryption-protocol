import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(path);
    return extname(entry.name) === '.ts' ? [path] : [];
  });
}

describe('Vercel Node ESM entrypoints', () => {
  it('use explicit .js extensions for relative imports', () => {
    const offenders = typescriptFiles(join(process.cwd(), 'api')).flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      return Array.from(source.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/gu))
        .map((match) => match[1])
        .filter((specifier) => !specifier.endsWith('.js'))
        .map((specifier) => `${path}: ${specifier}`);
    });

    expect(offenders).toEqual([]);
  });
});
