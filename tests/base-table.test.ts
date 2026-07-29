import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

test('BaseTable models runtime record values', () => {
  const templatePath = path.resolve('src/templates/base-table.ts');
  const template = readFileSync(templatePath, 'utf8');
  const fixturePath = path.resolve('BaseTable.fixture.ts');
  const fixture = `${template}

interface Incident extends BaseTable {
  active: boolean;
  short_description: string;
}

const incident: Incident = {
  active: true,
  short_description: 'Email is unavailable',
  sys_id: '46f3f5f8db1230108f3a5e1f2996197f',
  sys_created_on: '2026-07-29 12:00:00',
  sys_mod_count: 2
};

incident.sys_id?.toUpperCase();
`;
  const compilerOptions: ts.CompilerOptions = {
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2021
  };
  const host = ts.createCompilerHost(compilerOptions);
  const getSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (fileName, languageVersion, ...args) =>
    fileName === fixturePath
      ? ts.createSourceFile(fileName, fixture, languageVersion, true)
      : getSourceFile(fileName, languageVersion, ...args);

  const program = ts.createProgram([fixturePath], compilerOptions, host);
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    );

  expect(diagnostics).toEqual([]);
});
