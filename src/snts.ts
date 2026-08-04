#!/usr/bin/env node

import { $ } from 'execa';
import { Command } from 'commander';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, green, magenta, red } from 'colorette';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner
} from '@clack/prompts';
import type { Options } from './types/options.js';
import type { ConfigTarget } from './types/config.js';
import { detectProject, type ProjectState } from './project.js';

function cancelOperation(): never {
  cancel('Operation cancelled.');
  process.exit(0);
}

async function addFile(
  sourcefile: string,
  sourceDir: string,
  targetFile: string,
  targetDir: string | null,
  message: string
) {
  if (await confirmFile(message)) {
    const file = getTargetPath(targetFile, targetDir);
    const filePath = getFilePath(sourcefile, sourceDir);
    createFile(file, filePath);
  }
}

async function addInterfaceFile() {
  return await addFile(
    'base-table.ts',
    'src/templates',
    'BaseTable.ts',
    'ts/Types',
    `Add a legacy ${cyan('BaseTable.ts')} interface for common runtime record fields?`
  );
}

async function addPrettierFile() {
  return await addFile(
    '.prettierrc.json',
    'src/templates',
    '.prettierrc.json',
    null,
    `Add a ${cyan('.prettierrc.json')} default config?`
  );
}

async function confirmFile(msg: string) {
  const result = await confirm({
    message: msg
  });
  if (isCancel(result)) {
    cancelOperation();
  }
  return result;
}

function createFile(file: string, templatePath: string): void {
  const template = readFileSync(templatePath, 'utf8');
  writeFile(file, template);
}

function createTemplate(file: string, templatePath: string): void {
  const project = getProject();
  const template = readFileSync(templatePath, 'utf8');
  const data = template.replace(/@project/g, project);
  writeFile(file, data);
}

async function doBuild() {
  intro(`${bold(magenta(getConstants().projectName))}: Build`);
  const esVersion = await getConfigTypes();
  await addInterfaceFile();
  await addPrettierFile();
  await initGitRepo();
  const s = startPrompts('Installing config(s)', null);
  const filePath = getFilePath('tsconfig.json', 'src/templates');
  createTemplate('tsconfig.json', filePath);
  const template = readFileSync('tsconfig.json', 'utf8');
  const data = template.replace(/@version/g, esVersion);
  writeFile('tsconfig.json', data);
  stopPrompt(s, `The ${cyan('tsconfig.json')} file was bootstrapped.`);
  await runSync();
}

async function doClean() {
  const buildDir = path.join(getProject(), 'ts');
  await rm(buildDir, { recursive: true, force: true });
  console.log(`Removed the ${cyan(buildDir)} directory.`);
}

async function doCompile() {
  const s = startPrompts('Processing', 'Compile started');
  try {
    await transpile();
    stopPrompt(s, 'Completed');
  } catch (error) {
    stopPrompt(s, 'Compile failed');
    printError(error);
    process.exit(1);
  }
}

function doOptions(program: Command) {
  const options = parseOptions(program);
  if (options.length > 1) {
    console.error(
      bold(red('Options cannot be combined. Please pass one option at a time.'))
    );
    return process.exit(1);
  }
  const optionKey = options[0] as keyof Options | undefined;
  return handleOptions(program, getOptions(program), optionKey);
}

async function doSync() {
  const s = startPrompts('Processing', 'Sync started');
  try {
    await runSyncScript();
    stopPrompt(s, 'Completed');
  } catch (error) {
    stopPrompt(s, 'Sync failed');
    printError(error);
    process.exit(1);
  }
}

function getConfigTargets(): ConfigTarget[] {
  return [
    { value: 'es5', label: 'ES5' },
    { value: 'es6', label: 'ES2015', hint: 'ES6' },
    { value: 'es2021', label: 'ES2021' }
  ];
}

async function getConfigTypes(): Promise<ConfigTarget['value']> {
  const result = await select<ConfigTarget['value']>({
    message: 'Please pick a ECMAScript target.',
    options: getConfigTargets()
  });
  if (isCancel(result)) {
    cancelOperation();
  }
  return result;
}

function getConstants() {
  enum Constants {
    projectName = 'SN TypeScript Util',
    projectDescription = 'is a TS utility for ServiceNow developers using VS Code.',
    extensionDocsUrl = 'https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/applications/task/create-project.html',
    sdkDocsUrl = 'https://www.servicenow.com/docs/r/application-development/servicenow-sdk/developing-applications-sdk.html',
    buildOption = 'Build project utility files & package dependencies',
    compileOption = 'Compile TypeScript files to JavaScript & move to src',
    helpOption = 'Display help for command',
    removeOption = 'Remove & clean the ts build directory',
    syncOption = 'Sync new instance-based src files to the ts directory',
    versionOption = 'Output the current version'
  }
  return Constants;
}

function getDescription(version: string): string {
  const constants = getConstants();
  const title: string = constants.projectName;
  const description: string = constants.projectDescription;
  return `${bold(magenta(title))} ${description} ${gray(`(v${version})`)}\n`;
}

function getProjectError(
  state: Exclude<ProjectState, { kind: 'extension' }>
): string {
  const constants = getConstants();
  switch (state.kind) {
    case 'sdk':
      return `Detected a ServiceNow SDK / Fluent project.

SN TypeScript Util currently supports projects imported with the ServiceNow Extension for VS Code. SDK support is being explored.

No files were changed.

${constants.sdkDocsUrl}`;
    case 'conflicting':
      return `Detected both ServiceNow Extension and ServiceNow SDK project files (${state.markers.join(', ')}).

SN TypeScript Util will not modify this project until its workflow is unambiguous.

No files were changed.`;
    case 'invalid':
      return `The system/sn-workspace.json file could not be read as a valid ServiceNow Extension workspace.

No files were changed.`;
    case 'no-active-application':
      return `No active application detected. Select an application in the ServiceNow Extension for VS Code.

No files were changed.

${constants.extensionDocsUrl}`;
    case 'missing':
      return `No supported ServiceNow project was detected.

Run SN TypeScript Util from a project imported with the ServiceNow Extension for VS Code. ServiceNow SDK support is not available yet.

No files were changed.

${constants.extensionDocsUrl}`;
  }
}

function printProjectError(
  state: Exclude<ProjectState, { kind: 'extension' }>
) {
  console.error(bold(red(getProjectError(state))));
}

function getFilePath(file: string, dir: string): string {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  return path.join(dirName, '..', dir, file);
}

function getOptions(program: Command): Options {
  return {
    build: () => doBuild(),
    compile: () => doCompile(),
    help: () => showHelp(program),
    remove: () => doClean(),
    sync: () => doSync(),
    default: () => showHelp(program)
  };
}

function getPackageInfo() {
  return JSON.parse(readFileSync(getFilePath('package.json', '.'), 'utf8'));
}

function getProject(): string {
  const state = detectProject();
  if (state.kind !== 'extension') {
    throw new Error(getProjectError(state));
  }
  return state.project;
}

function getTargetPath(file: string, dir: string | null) {
  const project = getProject();
  const targetDir = dir ? path.join(project, dir) : '.';
  if (dir && !existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  return path.join(targetDir, file);
}

function getVersion() {
  const info = getPackageInfo();
  return info.version;
}

async function handleOptions(
  program: Command,
  options: Options,
  option: keyof Options | undefined
) {
  if (!option || option === 'help') {
    const version = getVersion();
    console.log(getDescription(version));
    return showHelp(program);
  }
  if (!hasExtensionProject()) {
    return process.exit(1);
  }
  return await options[option]();
}

function hasExtensionProject(): boolean {
  const state = detectProject();
  if (state.kind === 'extension') {
    return true;
  }
  printProjectError(state);
  return false;
}

try {
  await init();
} catch (error) {
  printError(error);
  process.exit(1);
}

async function init() {
  const program = new Command();
  const constants = getConstants();
  const version = getVersion();
  program.option('-b, --build', constants.buildOption);
  program.option('-c, --compile', constants.compileOption);
  program.option('-h, --help', constants.helpOption);
  program.option('-r, --remove', constants.removeOption);
  program.option('-s, --sync', constants.syncOption);
  program.version(version, '-v, --version', constants.versionOption);
  program.usage(cyan('[options]'));
  return doOptions(program);
}

async function initGitRepo() {
  const msg = `Initialize a new git repository?`;
  return (await confirmFile(msg)) && (await $`git init`);
}

function parseOptions(program: Command): string[] {
  return Object.keys(program.parse(process.argv).opts());
}

function printError(error: unknown) {
  const { stdout, stderr, message } = (error ?? {}) as {
    stdout?: string;
    stderr?: string;
    message?: string;
  };
  const output = [stdout, stderr].filter(Boolean).join('\n');
  console.error(output || bold(red(message ?? String(error))));
}

async function runSync() {
  const project = getProject();
  const s = startPrompts('Syncing', null);
  try {
    await runSyncScript();
    stopPrompt(
      s,
      `TypeScript files constructed in the ${cyan(project + '/ts')} directory.`
    );
    outro(`${green('Done!')}`);
  } catch (error) {
    stopPrompt(s, 'Sync failed');
    printError(error);
    process.exit(1);
  }
}

async function runSyncScript() {
  return await $`${getFilePath('sync.sh', 'scripts')}`;
}

function showHelp(program: Command) {
  return program.help();
}

function startPrompts(start: string, introMsg: string | null) {
  if (introMsg) {
    intro(introMsg);
  }
  const s = spinner();
  s.start(start);
  return s;
}

function stopPrompt(spinner: { stop: (msg: string) => void }, msg: string) {
  return spinner.stop(msg);
}

async function transpile() {
  const tscPath = getFilePath('tsc', 'node_modules/.bin');
  return await $`${tscPath}`;
}

function writeFile(file: string, data: string) {
  writeFileSync(file, data, { encoding: 'utf8' });
}
