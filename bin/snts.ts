#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(childProcess.exec);
const { description, version } = require('./../package.json');
const { program } = require('commander');
const { bold, cyan, red } = require('colorette');
const { cancel, intro, outro, spinner } = require('@clack/prompts');

function getBuildName() {
  const defaultBuild = 'utah';
  try {
    const workspace = JSON.parse(getWorkspaceConfig());
    const app = workspace.ACTIVE_APPLICATION;
    const build = workspace.ALL_APPLICATIONS[app].BUILD_NAME;
    return Object.entries(build).length !== 0
      ? build.toLowerCase()
      : defaultBuild;
  } catch (e) {
    return defaultBuild;
  }
}

function getErrorMsg() {
  var url = `https://docs.servicenow.com/bundle/${getBuildName()}-application-development/page/build/applications/task/create-project.html`;
  var msg = `No active application detected. Please create a project with the ServiceNow Extension for VS Code.\n\n${url}`;
  return console.error(bold(red(msg)));
}

function getFilePath(file) {
  return `${path.join(__dirname, '../scripts')}/${file}`;
}

function getOption(opts) {
  const option = Object.keys(opts).toString();
  const options = {
    build: () => {
      startBuild();
    },
    compile: () => {
      runScript('compile.rb');
    },
    sync: () => {
      runProgressScript('sync.sh');
    },
    default: () => {
      program.help();
    }
  };
  return (options[option] || options['default'])();
}

function getWorkspaceConfig() {
  return fs.readFileSync('./system/sn-workspace.json');
}

function hasApplication() {
  try {
    const app = JSON.parse(getWorkspaceConfig()).ACTIVE_APPLICATION;
    return Object.entries(app).length === 0 ? getErrorMsg() : true;
  } catch (e) {
    getErrorMsg();
    return process.exit(1);
  }
}

(() => {
  return init();
})();

function init() {
  program.description(description);
  program.version(version);
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
  program.parse(process.argv).opts();
  return hasApplication() && getOption(program.opts());
}

function introPrompt(msg) {
  return intro(msg);
}

async function runInstall() {
  const s = startPrompts('Installing packages', null);
  return await exec(getFilePath('install.sh'), (stdout) => {
    stopPrompt(s, 'Packages installed');
    outro('Completed');
    return stdout;
  });
}

async function runProgressScript(file) {
  const s = startPrompts('Processing', 'Sync started');
  return childProcess.exec(getFilePath(file), (stdout) => {
    stopPrompt(s, 'Completed');
    return stdout;
  });
}

async function runScript(file) {
  const s = startPrompts('Processing', 'Compile started');
  return childProcess.exec(getFilePath(file), (stdout) => {
    stopPrompt(s, 'Completed');
    return stdout;
  });
}

async function runSync() {
  return await exec(getFilePath('sync.sh'), (stdout) => {
    runInstall();
    return stdout;
  });
}

async function startBuild() {
  const s = startPrompts('Installing configs', 'Build started');
  return await exec(getFilePath('init.rb'), (stdout) => {
    stopPrompt(s, 'Configs installed');
    runSync();
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
