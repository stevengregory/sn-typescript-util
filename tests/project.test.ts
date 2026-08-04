import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { detectProject } from '../src/project.js';

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(path.join(tmpdir(), 'snts-project-'));
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

function writeJson(file: string, value: unknown) {
  const target = path.join(projectRoot, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(value));
}

describe('detectProject', () => {
  test('detects an Extension project with an active application', () => {
    writeJson('system/sn-workspace.json', {
      ACTIVE_APPLICATION: 'x_example_app',
      ALL_APPLICATIONS: {}
    });

    expect(detectProject(projectRoot)).toMatchObject({
      kind: 'extension',
      project: 'x_example_app'
    });
  });

  test('detects an SDK project from now.config.json', () => {
    writeJson('now.config.json', { scope: 'x_example_app' });

    expect(detectProject(projectRoot)).toEqual({
      kind: 'sdk',
      markers: ['now.config.json']
    });
  });

  test('detects an SDK project from its package dependency', () => {
    writeJson('package.json', {
      devDependencies: { '@servicenow/sdk': '^4.9.2' }
    });

    expect(detectProject(projectRoot)).toEqual({
      kind: 'sdk',
      markers: ['package.json (@servicenow/sdk)']
    });
  });

  test('stops when Extension and SDK markers coexist', () => {
    writeJson('system/sn-workspace.json', {
      ACTIVE_APPLICATION: 'x_example_app'
    });
    writeJson('now.config.json', { scope: 'x_example_app' });

    expect(detectProject(projectRoot)).toEqual({
      kind: 'conflicting',
      markers: ['system/sn-workspace.json', 'now.config.json']
    });
  });

  test('reports a workspace without an active application', () => {
    writeJson('system/sn-workspace.json', { ACTIVE_APPLICATION: '  ' });

    expect(detectProject(projectRoot)).toEqual({
      kind: 'no-active-application'
    });
  });

  test('reports an invalid workspace', () => {
    writeJson('system/sn-workspace.json', { ACTIVE_APPLICATION: 42 });

    expect(detectProject(projectRoot)).toMatchObject({ kind: 'invalid' });
  });

  test('reports malformed workspace JSON', () => {
    const workspacePath = path.join(projectRoot, 'system', 'sn-workspace.json');
    mkdirSync(path.dirname(workspacePath), { recursive: true });
    writeFileSync(workspacePath, '{');

    expect(detectProject(projectRoot)).toMatchObject({ kind: 'invalid' });
  });

  test('reports a directory without supported project markers', () => {
    expect(detectProject(projectRoot)).toEqual({ kind: 'missing' });
  });
});
