import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const cliPath = path.resolve('bin/snts.js');
let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(path.join(tmpdir(), 'snts-cli-'));
  writeFileSync(
    path.join(projectRoot, 'now.config.json'),
    JSON.stringify({ scope: 'x_example_app' })
  );
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

function runCli(option?: string) {
  const result = Bun.spawnSync({
    cmd: ['node', cliPath, ...(option ? [option] : [])],
    cwd: projectRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stderr: 'pipe',
    stdout: 'pipe'
  });

  return {
    exitCode: result.exitCode,
    stderr: result.stderr.toString(),
    stdout: result.stdout.toString()
  };
}

describe('SDK project guard', () => {
  for (const option of ['--build', '--compile', '--sync', '--remove']) {
    test(`blocks ${option} before changing the project`, () => {
      const configPath = path.join(projectRoot, 'now.config.json');
      const configBefore = readFileSync(configPath, 'utf8');
      const result = runCli(option);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain(
        'Detected a ServiceNow SDK / Fluent project.'
      );
      expect(result.stderr).toContain('No files were changed.');
      expect(readFileSync(configPath, 'utf8')).toBe(configBefore);
      expect(readdirSync(projectRoot)).toEqual(['now.config.json']);
    });
  }

  test('still displays help without requiring a supported project', () => {
    const result = runCli();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage: snts [options]');
  });

  test('preserves the existing Extension workflow', () => {
    rmSync(path.join(projectRoot, 'now.config.json'));
    mkdirSync(path.join(projectRoot, 'system'), { recursive: true });
    mkdirSync(path.join(projectRoot, 'x_example_app', 'ts'), {
      recursive: true
    });
    writeFileSync(
      path.join(projectRoot, 'system', 'sn-workspace.json'),
      JSON.stringify({ ACTIVE_APPLICATION: 'x_example_app' })
    );

    const result = runCli('--remove');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(existsSync(path.join(projectRoot, 'x_example_app', 'ts'))).toBe(
      false
    );
  });
});
