#!/usr/bin/env node

const childProcess = require('child_process');
const cliProgress = require('cli-progress');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(childProcess.exec);
const { description, version } = require('./../package.json');
const { program } = require('commander');
const { bold, red } = require('colorette');

(() => {
  return init();
})();

function getBuildName() {
  const defaultBuild = 'tokyo';
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

function getProgressBar() {
  return new cliProgress.SingleBar({
    format:
      'CLI Progress |' +
      colors.cyan('{bar}') +
      '| {percentage}% || {value}/{total} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
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
    return process.exit(e.code);
  }
}

function getFilePath(file) {
  return `${path.join(__dirname, '../scripts')}/${file}`;
}

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

function progressComplete(bar) {
  bar.update(100);
  bar.stop();
}

function progressStart(bar) {
  bar.start(100, 0);
  bar.update(1);
}

async function runConfigs(bar) {
  return await exec(getFilePath('init.rb'), (stdout) => {
    bar.update(10);
    runSync(bar);
    return stdout;
  });
}

async function runInstall(bar) {
  bar.update(50);
  return await exec(getFilePath('install.sh'), (stdout) => {
    progressComplete(bar);
    return stdout;
  });
}

function runProgressScript(file) {
  var bar = getProgressBar();
  progressStart(bar);
  return childProcess.exec(getFilePath(file), (stdout) => {
    progressComplete(bar);
    return stdout;
  });
}

function runScript(file) {
  return childProcess.exec(getFilePath(file), (stdout) => {
    return stdout;
  });
}

async function runSync(bar) {
  return await exec(getFilePath('sync.sh'), (stdout) => {
    bar.update(25);
    runInstall(bar);
    return stdout;
  });
}

async function startBuild() {
  var bar = getProgressBar();
  progressStart(bar);
  return await Promise.all([runConfigs(bar)]);
}
