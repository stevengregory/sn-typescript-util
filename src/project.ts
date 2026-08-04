import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SDK_PACKAGE_NAME = '@servicenow/sdk';

interface DetectedWorkspace {
  readonly ACTIVE_APPLICATION: string;
  readonly [key: string]: unknown;
}

export type ProjectState =
  | {
      kind: 'extension';
      workspace: DetectedWorkspace;
      project: string;
    }
  | {
      kind: 'sdk';
      markers: string[];
    }
  | {
      kind: 'conflicting';
      markers: string[];
    }
  | { kind: 'missing' }
  | { kind: 'no-active-application' }
  | {
      kind: 'invalid';
      cause: unknown;
    };

function hasDependency(value: unknown, name: string): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return ['dependencies', 'devDependencies'].some((key) => {
    const dependencies = value[key];
    return isRecord(dependencies) && typeof dependencies[name] === 'string';
  });
}

function hasSdkDependency(packagePath: string): boolean {
  if (!existsSync(packagePath)) {
    return false;
  }

  try {
    return hasDependency(readJson(packagePath), SDK_PACKAGE_NAME);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseWorkspace(value: unknown): DetectedWorkspace {
  if (!isRecord(value) || typeof value.ACTIVE_APPLICATION !== 'string') {
    throw new TypeError('ACTIVE_APPLICATION must be a string.');
  }

  return {
    ...value,
    ACTIVE_APPLICATION: value.ACTIVE_APPLICATION
  };
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

export function detectProject(root = process.cwd()): ProjectState {
  const workspacePath = path.join(root, 'system', 'sn-workspace.json');
  const sdkConfigPath = path.join(root, 'now.config.json');
  const packagePath = path.join(root, 'package.json');
  const hasWorkspace = existsSync(workspacePath);
  const sdkMarkers = [
    ...(existsSync(sdkConfigPath) ? ['now.config.json'] : []),
    ...(hasSdkDependency(packagePath)
      ? [`package.json (${SDK_PACKAGE_NAME})`]
      : [])
  ];

  if (hasWorkspace && sdkMarkers.length > 0) {
    return {
      kind: 'conflicting',
      markers: ['system/sn-workspace.json', ...sdkMarkers]
    };
  }

  if (sdkMarkers.length > 0) {
    return { kind: 'sdk', markers: sdkMarkers };
  }

  if (!hasWorkspace) {
    return { kind: 'missing' };
  }

  try {
    const workspace = parseWorkspace(readJson(workspacePath));
    const project = workspace.ACTIVE_APPLICATION.trim();
    if (!project) {
      return { kind: 'no-active-application' };
    }
    return { kind: 'extension', workspace, project };
  } catch (cause) {
    return { kind: 'invalid', cause };
  }
}
