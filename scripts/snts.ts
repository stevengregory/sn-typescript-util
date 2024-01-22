#!/usr/bin/env node

import { $ } from 'execa';
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, magenta, red } from 'colorette';
import { intro, outro, spinner } from '@clack/prompts';
import { Options } from './types/options.js';
import { Workspace } from './types/workspace.js';

async function doBuild() {
  const s = startPrompts('Installing configs', 'Build started');
  return await execFile(
    getFilePath('init.rb', 'scripts/build'),
    (stdout: unknown) => {
      stopPrompt(s, 'Configs installed');
      runSync();
      return stdout;
    }
  );
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

function getConstants() {
  enum Constants {
    projectName = 'SN TypeScript Util',
    projectDescription = 'is a TS utility for ServiceNow developers using VS Code.',
    errorMsg = 'No active application detected. Please create a project with the ServiceNow Extension for VS Code.',
    docsUrl = 'https://docs.servicenow.com/bundle/vancouver-application-development/page/build/applications/task/create-project.html',
    buildOption = 'Build project utility files & package dependencies',
    compileOption = 'Compile TypeScript files to JavaScript & move to src',
    helpOption = 'Display help for command',
    removeOption = 'Remove & clean the build directory',
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

function getFilePath(file: string, dir: string = 'scripts/build') {
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
  const s = startPrompts('Syncing', null);
  return await execFile(
    getFilePath('sync.sh', 'scripts/build'),
    (stdout: unknown) => {
      stopPrompt(s, 'Sync completed');
      outro('Completed');
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
