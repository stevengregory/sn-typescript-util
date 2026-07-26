import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cancel, confirm, intro, outro, select } from '@clack/prompts';
import type { Version, VersionType } from '../src/types/version.js';

interface CliOptions {
  dryRun: boolean;
  releaseType?: VersionType;
  status: boolean;
  yes: boolean;
}

interface CommandResult {
  status: number;
  stderr: string;
  stdout: string;
}

interface PackageInfo {
  name: string;
  version: string;
}

interface ReleaseState {
  head: string;
  packageInfo: PackageInfo;
  published: boolean;
  remoteTagTarget?: string;
  tag: string;
}

const DEFAULT_BRANCH = 'master';
const REMOTE = 'origin';
const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

function cancelOperation(message = 'Operation cancelled.'): never {
  cancel(message);
  process.exit(0);
}

function commandError(command: string, args: string[], result: CommandResult) {
  const detail =
    result.stderr || result.stdout || `Exited with ${result.status}`;
  return new Error(`${command} ${args.join(' ')} failed:\n${detail.trim()}`);
}

function computeNextVersion(version: string, releaseType: VersionType): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);

  if (releaseType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (releaseType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

async function confirmAction(message: string, assumeYes: boolean) {
  if (assumeYes) {
    return true;
  }

  const answer = await confirm({ message });
  if (typeof answer === 'symbol') {
    cancelOperation();
  }
  return answer;
}

function ensureCleanWorkingTree() {
  const status = runCapture('git', ['status', '--porcelain']);
  if (status.stdout.trim()) {
    throw new Error(
      'The working tree must be clean before starting a release.'
    );
  }
}

function ensureCommand(command: string, args = ['--version']) {
  const result = runCapture(command, args, true);
  if (result.status !== 0) {
    throw new Error(`${command} is required for the release workflow.`);
  }
}

function ensureOnDefaultBranch() {
  const branch = runCapture('git', ['branch', '--show-current']).stdout.trim();
  if (branch !== DEFAULT_BRANCH) {
    throw new Error(
      `Run the release command from ${DEFAULT_BRANCH}; current branch is ${branch || 'detached HEAD'}.`
    );
  }
}

function getLocalTagTarget(tag: string): string | undefined {
  const result = runCapture(
    'git',
    ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`],
    true
  );
  return result.status === 0 ? result.stdout.trim() : undefined;
}

function getOptions(): Version[] {
  return [
    { value: 'patch', label: 'Patch' },
    { value: 'minor', label: 'Minor' },
    { value: 'major', label: 'Major' }
  ];
}

function getPackageInfo(): PackageInfo {
  return JSON.parse(
    readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
  );
}

function getRemoteTagTarget(tag: string): string | undefined {
  const result = runCapture('git', [
    'ls-remote',
    '--tags',
    REMOTE,
    `refs/tags/${tag}`,
    `refs/tags/${tag}^{}`
  ]);
  const refs = result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split(/\s+/));
  const peeled = refs.find(([, ref]) => ref === `refs/tags/${tag}^{}`);
  const direct = refs.find(([, ref]) => ref === `refs/tags/${tag}`);
  return (peeled ?? direct)?.[0];
}

function getVersionAtRef(ref: string): string | undefined {
  const result = runCapture('git', ['show', `${ref}:package.json`], true);
  if (result.status !== 0) {
    return undefined;
  }
  return (JSON.parse(result.stdout) as PackageInfo).version;
}

function isPublished(packageInfo: PackageInfo): boolean {
  const result = runCapture(
    'npm',
    ['view', `${packageInfo.name}@${packageInfo.version}`, 'version', '--json'],
    true
  );
  if (result.status === 0) {
    return result.stdout.includes(packageInfo.version);
  }

  if (`${result.stdout}\n${result.stderr}`.includes('E404')) {
    return false;
  }

  throw commandError(
    'npm',
    ['view', `${packageInfo.name}@${packageInfo.version}`, 'version', '--json'],
    result
  );
}

function isAncestor(ancestor: string, descendant: string): boolean {
  return (
    runCapture(
      'git',
      ['merge-base', '--is-ancestor', ancestor, descendant],
      true
    ).status === 0
  );
}

function isVersionType(value: unknown): value is VersionType {
  return value === 'patch' || value === 'minor' || value === 'major';
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    status: false,
    yes: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--status') {
      options.status = true;
    } else if (arg === '--yes') {
      options.yes = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--type') {
      const releaseType = args[index + 1];
      if (!isVersionType(releaseType)) {
        throw new Error('--type must be patch, minor, or major.');
      }
      options.releaseType = releaseType;
      index += 1;
    } else if (arg.startsWith('--type=')) {
      const releaseType = arg.slice('--type='.length);
      if (!isVersionType(releaseType)) {
        throw new Error('--type must be patch, minor, or major.');
      }
      options.releaseType = releaseType;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: bun run release [options]

Without options, the command prepares the next release PR or publishes a
version-bump PR that has already been merged.

Options:
  --type <patch|minor|major>  Select the next version without prompting
  --yes                      Accept confirmation prompts
  --dry-run                  Show planned mutations without performing them
  --status                   Show the current release state
  -h, --help                 Show this help`);
}

function printState(state: ReleaseState) {
  const tagState = state.remoteTagTarget
    ? `present at ${state.remoteTagTarget.slice(0, 7)}`
    : 'not pushed';
  console.log(`
Package: ${state.packageInfo.name}@${state.packageInfo.version}
Branch:  ${DEFAULT_BRANCH} at ${state.head.slice(0, 7)}
Tag:     ${state.tag} (${tagState})
npm:     ${state.published ? 'published' : 'not published'}
`);
}

async function publishRelease(state: ReleaseState, options: CliOptions) {
  const localTagTarget = getLocalTagTarget(state.tag);
  if (localTagTarget && localTagTarget !== state.head) {
    throw new Error(
      `Local tag ${state.tag} points to ${localTagTarget}, not ${state.head}.`
    );
  }

  if (state.remoteTagTarget && state.remoteTagTarget !== state.head) {
    throw new Error(
      `Remote tag ${state.tag} points to ${state.remoteTagTarget}, not ${state.head}.`
    );
  }

  const approved = await confirmAction(
    `${state.remoteTagTarget ? 'Publish' : 'Tag and publish'} ${state.tag} from ${DEFAULT_BRANCH}?`,
    options.yes
  );
  if (!approved) {
    cancelOperation();
  }

  console.log('Validating the release...');
  runInteractive('bun', ['install', '--frozen-lockfile']);
  runInteractive('bun', ['run', 'typecheck']);
  runInteractive('npm', ['pack', '--dry-run']);

  if (options.dryRun) {
    console.log(
      `[dry-run] Would ${state.remoteTagTarget ? '' : `push ${state.tag}, then `}publish ${state.packageInfo.name}@${state.packageInfo.version}.`
    );
    return;
  }

  const npmAuth = runCapture('npm', ['whoami'], true);
  if (npmAuth.status !== 0) {
    throw new Error('Authenticate npm with `npm login` before publishing.');
  }

  if (!state.remoteTagTarget) {
    if (!localTagTarget) {
      runInteractive('git', ['tag', state.tag]);
    }
    runInteractive('git', ['push', REMOTE, state.tag]);
  }

  runInteractive('npm', ['publish']);

  if (!isPublished(state.packageInfo)) {
    throw new Error(
      `${state.packageInfo.name}@${state.packageInfo.version} was not visible in npm after publishing.`
    );
  }

  outro(`${state.tag} is published and tagged.`);
}

function createReleasePr(branch: string, tag: string, body: string): string {
  return runCapture('gh', [
    'pr',
    'create',
    '--base',
    DEFAULT_BRANCH,
    '--head',
    branch,
    '--title',
    `chore: release ${tag}`,
    '--body',
    body
  ]).stdout.trim();
}

async function prepareRelease(state: ReleaseState, options: CliOptions) {
  ensureCommand('gh');
  const auth = runCapture('gh', ['auth', 'status'], true);
  if (auth.status !== 0) {
    throw new Error(
      'Authenticate GitHub CLI with `gh auth login` before releasing.'
    );
  }

  let releaseType = options.releaseType;
  if (!releaseType) {
    const answer = await select({
      message: 'Please pick a release type.',
      options: getOptions()
    });
    if (!isVersionType(answer)) {
      cancelOperation();
    }
    releaseType = answer;
  }

  const nextVersion = computeNextVersion(
    state.packageInfo.version,
    releaseType
  );
  const tag = `v${nextVersion}`;
  const branch = `release/${tag}`;
  const body = `## Release

- Bump ${state.packageInfo.name} from ${state.packageInfo.version} to ${nextVersion}

After this PR is merged, run \`bun run release\` from ${DEFAULT_BRANCH} to validate, tag, and publish ${tag}.`;
  const approved = await confirmAction(
    `Prepare ${tag} in a release PR?`,
    options.yes
  );
  if (!approved) {
    cancelOperation();
  }

  const localBranch = runCapture(
    'git',
    ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`],
    true
  );
  const remoteBranch = runCapture('git', [
    'ls-remote',
    '--heads',
    REMOTE,
    `refs/heads/${branch}`
  ]);
  const hasLocalBranch = localBranch.status === 0;
  const hasRemoteBranch = Boolean(remoteBranch.stdout.trim());
  if (hasLocalBranch || hasRemoteBranch) {
    const branchRef = hasRemoteBranch ? `${REMOTE}/${branch}` : branch;
    const branchVersion = getVersionAtRef(branchRef);
    if (branchVersion !== nextVersion) {
      throw new Error(
        `${branch} already exists with version ${branchVersion ?? 'unknown'}, expected ${nextVersion}.`
      );
    }

    const existingPr = runCapture('gh', [
      'pr',
      'list',
      '--base',
      DEFAULT_BRANCH,
      '--head',
      branch,
      '--state',
      'open',
      '--json',
      'url',
      '--jq',
      '.[0].url'
    ]).stdout.trim();
    if (existingPr) {
      outro(`Release PR already exists: ${existingPr}`);
      return;
    }

    if (options.dryRun) {
      console.log(
        `[dry-run] Would ${hasRemoteBranch ? '' : `push ${branch}, then `}open its release PR into ${DEFAULT_BRANCH}.`
      );
      return;
    }

    if (!hasRemoteBranch) {
      runInteractive('git', ['push', '-u', REMOTE, branch]);
    }
    const pr = createReleasePr(branch, tag, body);
    outro(`Release PR created: ${pr}`);
    return;
  }

  if (options.dryRun) {
    console.log(`[dry-run] Would:
  1. Create ${branch}
  2. Bump package.json to ${nextVersion}
  3. Commit and push the release branch
  4. Open a pull request into ${DEFAULT_BRANCH}

After that PR is merged, run bun run release again to tag and publish.`);
    return;
  }

  console.log('Validating the current branch...');
  runInteractive('bun', ['install', '--frozen-lockfile']);
  runInteractive('bun', ['run', 'typecheck']);

  runInteractive('git', ['switch', '-c', branch]);
  runInteractive('npm', ['version', nextVersion, '--no-git-tag-version']);

  const allowedFiles = [
    'package.json',
    'package-lock.json',
    'npm-shrinkwrap.json'
  ].filter((file) => existsSync(path.join(projectRoot, file)));
  const changedFiles = runCapture('git', ['status', '--porcelain'])
    .stdout.split('\n')
    .filter((line) => line.trim())
    .map((line) => line.slice(3));
  const unexpectedFiles = changedFiles.filter(
    (file) => !allowedFiles.includes(file)
  );
  if (unexpectedFiles.length > 0) {
    throw new Error(
      `Version bump changed unexpected files: ${unexpectedFiles.join(', ')}`
    );
  }

  runInteractive('git', ['add', ...allowedFiles]);
  runInteractive('git', ['commit', '-m', 'chore: bump the version']);
  runInteractive('git', ['push', '-u', REMOTE, branch]);

  const pr = createReleasePr(branch, tag, body);

  runInteractive('git', ['switch', DEFAULT_BRANCH]);
  outro(`Release PR created: ${pr}`);
  console.log(`After it is merged, run:

  bun run release
`);
}

function readReleaseState(): ReleaseState {
  const packageInfo = getPackageInfo();
  const tag = `v${packageInfo.version}`;
  return {
    head: runCapture('git', ['rev-parse', 'HEAD']).stdout.trim(),
    packageInfo,
    published: isPublished(packageInfo),
    remoteTagTarget: getRemoteTagTarget(tag),
    tag
  };
}

function runCapture(
  command: string,
  args: string[],
  allowFailure = false
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const commandResult: CommandResult = {
    status: result.status ?? 1,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? ''
  };

  if (result.error) {
    throw result.error;
  }
  if (!allowFailure && commandResult.status !== 0) {
    throw commandError(command, args, commandResult);
  }
  return commandResult;
}

function runInteractive(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with ${result.status ?? 'an error'}.`
    );
  }
}

function syncDefaultBranch() {
  runInteractive('git', ['fetch', REMOTE, '--tags']);
  runInteractive('git', ['pull', '--ff-only', REMOTE, DEFAULT_BRANCH]);
  const head = runCapture('git', ['rev-parse', 'HEAD']).stdout.trim();
  const remoteHead = runCapture('git', [
    'rev-parse',
    `${REMOTE}/${DEFAULT_BRANCH}`
  ]).stdout.trim();
  if (head !== remoteHead) {
    throw new Error(
      `${DEFAULT_BRANCH} must match ${REMOTE}/${DEFAULT_BRANCH} before releasing.`
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  intro('Release Utils');
  ensureCommand('git');
  ensureCommand('npm');
  ensureCommand('bun');
  ensureCleanWorkingTree();
  ensureOnDefaultBranch();
  syncDefaultBranch();

  const state = readReleaseState();
  if (options.status) {
    printState(state);
    return;
  }

  if (state.published && state.remoteTagTarget) {
    if (!isAncestor(state.remoteTagTarget, state.head)) {
      throw new Error(
        `${state.tag} points to ${state.remoteTagTarget}, which is not part of ${DEFAULT_BRANCH}.`
      );
    }
    await prepareRelease(state, options);
    return;
  }

  if (state.published && !state.remoteTagTarget) {
    throw new Error(
      `${state.packageInfo.name}@${state.packageInfo.version} is published, but ${state.tag} is missing on GitHub. Repair the tag before preparing another release.`
    );
  }

  await publishRelease(state, options);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  cancel(message);
  process.exitCode = 1;
});
