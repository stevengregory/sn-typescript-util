#!/usr/bin/env node

import { $ } from 'execa';
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, green, magenta, red } from 'colorette';
import { confirm, intro, outro, select, spinner } from '@clack/prompts';
import { Options } from './types/options.js';
import { Workspace } from './types/workspace.js';

async function addFile(
  sourcefile: string,
  sourceDir: string,
  targetFile: string,
  targetDir: string | any,
  message: string
) {
  if (await confirmFile(message)) {
    const file = await getTargetPath(targetFile, targetDir);
    const filePath = getFilePath(sourcefile, sourceDir);
    createFile(file, filePath);
  }
}

async function addInterfaceFile() {
  return await addFile(
    'base-table.ts',
    'scripts/templates',
    'BaseTable.ts',
    'ts/Types',
    `${getConstants().confirmInterfaceMsg}`
  );
}

async function addPrettierFile() {
  return await addFile(
    '.prettierrc.json',
    'scripts/templates',
    '.prettierrc.json',
    null,
    `${getConstants().confirmPrettierMsg}`
  );
}

async function confirmFile(msg: string) {
  return await confirm({
    message: `${msg}`
  });
}

async function createFile(file: string, path: string): Promise<void> {
  const template = readFileSync(path, 'utf8');
  return await writeFile(file, template);
}

async function createTemplate(file: string, path: string): Promise<void> {
  const project = await getProject();
  const template = readFileSync(path, 'utf8');
  const data = template.replace(/@project/g, project);
  return await writeFile(file, data);
}

async function doBuild() {
  introPrompt(`${bold(magenta(getConstants().projectName))}: Build`);
  const esVersion: any = await getConfigTypes();
  await addInterfaceFile();
  await addPrettierFile();
  const s = startPrompts('Installing config(s)', null);
  const filePath = getFilePath('tsconfig.json', 'scripts/templates');
  await createTemplate('tsconfig.json', filePath);
  const template = readFileSync('tsconfig.json', 'utf8');
  const data = template.replace(/@version/g, esVersion);
  await writeFile('tsconfig.json', data);
  stopPrompt(s, `The ${cyan('tsconfig.json')} file was bootstrapped.`);
  runSync();
}

async function doClean() {
  const project = await getProject();
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
    getFilePath('sync.sh', 'scripts/build'),
    (stdout: unknown) => {
      stopPrompt(s, 'Completed');
      return stdout;
    }
  );
}

function getConfigTargets() {
  return [
    { value: 'es5', label: 'ES5', hint: 'recommended' },
    { value: 'es6', label: 'ES2015', hint: 'ES6' },
    { value: 'es2021', label: 'ES2021' }
  ];
}

async function getConfigTypes() {
  return select({
    message: 'Please pick a ECMAScript target.',
    options: getConfigTargets()
  });
}

function getConstants() {
  enum Constants {
    projectName = 'SN TypeScript Util',
    projectDescription = 'is a TS utility for ServiceNow developers using VS Code.',
    confirmInterfaceMsg = `Add a ${cyan('BaseTable.ts')} interface with global default fields?`,
    confirmPrettierMsg = `Add a ${cyan('.prettierrc.json')} default config?`,
    errorMsg = 'No active application detected. Please create a project with the ServiceNow Extension for VS Code.',
    docsUrl = 'https://docs.servicenow.com/bundle/vancouver-application-development/page/build/applications/task/create-project.html',
    buildOption = 'Build project utility files & package dependencies',
    compileOption = 'Compile TypeScript files to JavaScript & move to src',
    helpOption = 'Display help for command',
    removeOption = 'Remove & clean the ts build directory',
    syncOption = 'Sync new instance-based src files to the ts directory',
    versionOption = 'Output the current version'
  }
  return Constants;
}

function getDescription(version: string) {
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

function getFilePath(file: string, dir: string) {
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

async function getPackageInfo() {
  return JSON.parse(readFileSync(getFilePath('package.json', '.')).toString());
}

async function getProject() {
  const workspace = await getWorkspace();
  return workspace.ACTIVE_APPLICATION;
}

async function getTargetPath(file: string, dir: string) {
  const project = await getProject();
  const path = dir ? `${project}/${dir}/` : '.';
  dir && !existsSync(path) && mkdirSync(path, { recursive: true });
  return `${path}/${file}`;
}

async function getVersion() {
  const info = await getPackageInfo();
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
    const version = await getVersion();
    console.log(getDescription(version));
    showHelp(program);
  }
  return (
    shouldShowHelp(program, option) ||
    ((hasApplication() && options[option]) || showHelp(program))()
  );
}

async function hasApplication() {
  try {
    const workspace: Workspace = await getWorkspace();
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
  const version = await getVersion();
  program.option('-b, --build', constants.buildOption);
  program.option('-c, --compile', constants.compileOption);
  program.option('-h, --help', constants.helpOption);
  program.option('-r, --remove', constants.removeOption);
  program.option('-s, --sync', constants.syncOption);
  program.version(version, '-v, --version', constants.versionOption);
  program.usage(cyan('[options]'));
  return doOptions(program);
}

function introPrompt(msg: string) {
  return intro(msg);
}

function parseOptions(program: Command) {
  const options = program.parse(process.argv).opts();
  return options && Object.keys(program.opts()).toString();
}

async function runSync() {
  const project = await getProject();
  const s = startPrompts('Syncing', null);
  return await execFile(
    getFilePath('sync.sh', 'scripts/build'),
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
  intro && introPrompt(intro);
  const s = spinner();
  s.start(start);
  return s;
}

function stopPrompt(spinner: any, msg: string) {
  return spinner.stop(msg);
}

async function transpile() {
  return await $`tsc`;
}

async function writeFile(file: string, data: string) {
  try {
    return writeFileSync(file, data, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Error writing file: ${error}`);
  }
}
