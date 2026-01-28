#!/usr/bin/env node

import { $ } from 'execa';
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, green, magenta, red } from 'colorette';
import { cancel, confirm, intro, outro, select, spinner } from '@clack/prompts';
import type { Options } from './types/options.js';
import type { Workspace } from './types/workspace.js';
import type { ConfigTarget } from './types/config.js';

function cancelOperation() {
  cancel('Operation cancelled.');
  process.exit(0);
}

function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
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
    await createFile(file, filePath);
  }
}

async function addInterfaceFile() {
  return await addFile(
    'base-table.ts',
    'src/templates',
    'BaseTable.ts',
    'ts/Types',
    `Add a ${cyan('BaseTable.ts')} interface with global default fields?`
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
    message: `${msg}`
  });
  if (isSymbol(result)) {
    cancelOperation();
  }
  return result;
}

async function createFile(file: string, path: string): Promise<void> {
  const template = readFileSync(path, 'utf8');
  return await writeFile(file, template);
}

async function createTemplate(file: string, path: string): Promise<void> {
  const project = getProject();
  const template = readFileSync(path, 'utf8');
  const data = template.replace(/@project/g, project);
  return await writeFile(file, data);
}

async function doBuild() {
  introPrompt(`${bold(magenta(getConstants().projectName))}: Build`);
  const esVersion = await getConfigTypes();
  await addInterfaceFile();
  await addPrettierFile();
  await initGitRepo();
  const s = startPrompts('Installing config(s)', null);
  const filePath = getFilePath('tsconfig.json', 'src/templates');
  await createTemplate('tsconfig.json', filePath);
  const template = readFileSync('tsconfig.json', 'utf8');
  const data = template.replace(/@version/g, esVersion as string);
  await writeFile('tsconfig.json', data);
  stopPrompt(s, `The ${cyan('tsconfig.json')} file was bootstrapped.`);
  await runSync();
}

async function doClean() {
  const project = getProject();
  const dirName = path.dirname(project);
  const buildDir = `${path.join(dirName, project)}/ts`;
  return await $`rm -rf ${buildDir}`;
}

async function doCompile() {
  const s = startPrompts('Processing', 'Compile started');
  const compile = await transpile();
  return compile && stopPrompt(s, 'Completed');
}

function doOptions(program: Command) {
  const options = parseOptions(program);
  const optionKey = options as keyof Options;
  return handleOptions(program, getOptions(program), optionKey);
}

async function doSync() {
  const s = startPrompts('Processing', 'Sync started');
  return await execFile(
    getFilePath('sync.sh', 'scripts'),
    (stdout: unknown) => {
      stopPrompt(s, 'Completed');
      return stdout;
    }
  );
}

function getConfigTargets(): ConfigTarget[] {
  return [
    { value: 'es5', label: 'ES5', hint: 'recommended' },
    { value: 'es6', label: 'ES2015', hint: 'ES6' },
    { value: 'es2021', label: 'ES2021' }
  ];
}

async function getConfigTypes(): Promise<string> {
  const result = await select({
    message: 'Please pick a ECMAScript target.',
    options: getConfigTargets()
  });
  if (isSymbol(result)) {
    cancelOperation();
  }
  return result as string;
}

function getConstants() {
  enum Constants {
    projectName = 'SN TypeScript Util',
    projectDescription = 'is a TS utility for ServiceNow developers using VS Code.',
    errorMsg = 'No active application detected. Please create a project with the ServiceNow Extension for VS Code.',
    docsUrl = 'https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/applications/task/create-project.html',
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

function getErrorMsg() {
  const constants = getConstants();
  const msg: string = `${constants.errorMsg}\n\n${constants.docsUrl}`;
  return console.error(bold(red(msg)));
}

function getFilePath(file: string, dir: string): string {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  return `${path.join(dirName, `../${dir}`)}/${file}`;
}

function getOptions(program: Command): Options {
  return {
    build: () => {
      doBuild();
    },
    compile: () => {
      doCompile();
    },
    help: () => {
      showHelp(program);
    },
    remove: () => {
      doClean();
    },
    sync: () => {
      doSync();
    },
    default: () => {
      showHelp(program);
    }
  };
}

function getPackageInfo() {
  return JSON.parse(readFileSync(getFilePath('package.json', '.')).toString());
}

function getProject(): string {
  const workspace = getWorkspace();
  return workspace.ACTIVE_APPLICATION;
}

function getTargetPath(file: string, dir: string | null) {
  const project = getProject();
  const path = dir ? `${project}/${dir}/` : '.';
  if (dir && !existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
  return `${path}/${file}`;
}

function getVersion() {
  const info = getPackageInfo();
  return info.version;
}

function getWorkspace() {
  return JSON.parse(readFileSync('./system/sn-workspace.json').toString());
}

function handleError() {
  getErrorMsg();
  return process.exit(1);
}

async function handleOptions(
  program: Command,
  options: Options,
  option: keyof Options
) {
  if (option === 'help' || !option) {
    const version = getVersion();
    console.log(getDescription(version));
    showHelp(program);
  }
  return (
    shouldShowHelp(program, option) ||
    ((hasApplication() && options[option]) || showHelp(program))()
  );
}

function hasApplication() {
  try {
    const workspace: Workspace = getWorkspace();
    const app: string = workspace.ACTIVE_APPLICATION;
    return Object.entries(app).length === 0 ? getErrorMsg() : true;
  } catch {
    return handleError();
  }
}

(async () => {
  return init();
})();

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

function introPrompt(msg: string) {
  return intro(msg);
}

function parseOptions(program: Command): string {
  const options = program.parse(process.argv).opts();
  return options && Object.keys(program.opts()).toString();
}

async function runSync() {
  const project = getProject();
  const s = startPrompts('Syncing', null);
  return await execFile(
    getFilePath('sync.sh', 'scripts'),
    (stdout: unknown) => {
      stopPrompt(
        s,
        `TypeScript files constructed in the ${cyan(project + '/ts')} directory.`
      );
      outro(`${green('Done!')}`);
      return stdout;
    }
  );
}

function shouldShowHelp(program: Command, option: string) {
  return !option && showHelp(program);
}

function showHelp(program: Command) {
  return program.help();
}

function startPrompts(start: string, intro: string | null) {
  if (intro) {
    introPrompt(intro);
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

async function writeFile(file: string, data: string) {
  try {
    return writeFileSync(file, data, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Error writing file: ${error}`);
  }
}
