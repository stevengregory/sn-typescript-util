#!/usr/bin/env node
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, red } from 'colorette';
import { intro, outro, spinner } from '@clack/prompts';
async function doBuild() {
  const s = startPrompts('Installing configs', 'Build started');
  return await execFile(getFilePath('init.rb'), (stdout) => {
    stopPrompt(s, 'Configs installed');
    runSync();
    return stdout;
  });
}
async function doCompile() {
  const s = startPrompts('Processing', 'Compile started');
  return await execFile(getFilePath('compile.rb'), (stdout) => {
    stopPrompt(s, 'Completed');
    return stdout;
  });
}
function doOptions(program) {
  program.parse(process.argv).opts();
  const option = Object.keys(program.opts()).toString();
  const options = {
    build: () => {
      doBuild();
    },
    compile: () => {
      doCompile();
    },
    sync: () => {
      doSync();
    },
    default: () => {
      program.help();
    }
  };
  return ((hasApplication() && options[option]) || options['default'])();
}
async function doSync() {
  const s = startPrompts('Processing', 'Sync started');
  return await execFile(getFilePath('sync.sh'), (stdout) => {
    stopPrompt(s, 'Completed');
    return stdout;
  });
}
function getErrorMsg() {
  const url = `https://docs.servicenow.com/bundle/vancouver-application-development/page/build/applications/task/create-project.html`;
  const msg = `No active application detected. Please create a project with the ServiceNow Extension for VS Code.\n\n${url}`;
  return console.error(bold(red(msg)));
}
function getFilePath(file, dir = 'scripts') {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  return `${path.join(dirName, `../${dir}`)}/${file}`;
}
async function getPackageInfo() {
  return JSON.parse(readFileSync(getFilePath('package.json', '.')).toString());
}
function getWorkspace() {
  return JSON.parse(readFileSync('./system/sn-workspace.json').toString());
}
async function hasApplication() {
  try {
    const workspace = await getWorkspace();
    const app = workspace.ACTIVE_APPLICATION;
    return Object.entries(app).length === 0 ? getErrorMsg() : true;
  } catch (e) {
    getErrorMsg();
    return process.exit(1);
  }
}
(async () => {
  return init();
})();
async function init() {
  const program = new Command();
  const info = await getPackageInfo();
  program.description(info.description);
  program.version(info.version);
  program.option(
    '-b, --build',
    'build project utility files & package dependencies'
  );
  program.option(
    '-c, --compile',
    'compile TypeScript files to JavaScript & move to src'
  );
  program.option(
    '-s, --sync',
    'sync new instance-based src files to the ts directory'
  );
  return doOptions(program);
}
function introPrompt(msg) {
  return intro(msg);
}
async function runSync() {
  const s = startPrompts('Syncing', null);
  return await execFile(getFilePath('sync.sh'), (stdout) => {
    stopPrompt(s, 'Sync completed');
    outro('Completed');
    return stdout;
  });
}
function startPrompts(start, intro) {
  intro && introPrompt(intro);
  const s = spinner();
  s.start(start);
  return s;
}
function stopPrompt(spinner, msg) {
  return spinner.stop(msg);
}
