#!/usr/bin/env node

import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, magenta, red } from 'colorette';
import { intro, outro, spinner } from '@clack/prompts';
import { constants } from './utils/constants.js';
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

async function doCompile() {
  const s = startPrompts('Processing', 'Compile started');
  return await execFile(
    getFilePath('compile.rb', 'scripts/build'),
    (stdout: unknown) => {
      stopPrompt(s, 'Completed');
      return stdout;
    }
  );
}

function doOptions(program: Command, version: string) {
  const options = parseOptions(program);
  const optionKey = options as keyof Options;
  return handleOptions(program, getOptions(program), optionKey, version);
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

function getDescription(version: string) {
  const title: string = constants.projectName;
  const description: string = constants.projectDescription;
  return `${bold(magenta(title))} ${description} ${gray(`(v${version})`)}\n`;
}

function getErrorMsg() {
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

function getWorkspace() {
  return JSON.parse(readFileSync('./system/sn-workspace.json').toString());
}

function handleError() {
  getErrorMsg();
  return process.exit(1);
}

function handleOptions(
  program: Command,
  options: Options,
  option: keyof Options,
  version: string
) {
  if (option === 'help' || !option) {
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
  const info = await getPackageInfo();
  const version = info.version;
  program.option(
    '-b, --build',
    'build project utility files & package dependencies'
  );
  program.option(
    '-c, --compile',
    'compile TypeScript files to JavaScript & move to src'
  );
  program.option('-h, --help', 'display help for command');
  program.option(
    '-s, --sync',
    'sync new instance-based src files to the ts directory'
  );
  program.version(version, '-v, --version', 'output the current version');
  program.usage(cyan('[options]'));
  return doOptions(program, version);
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
