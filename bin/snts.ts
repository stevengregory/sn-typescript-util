#!/usr/bin/env node

const childProcess = require('child_process');
const cliProgress = require('cli-progress');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const { description, version } = require('./../package.json');
const { program } = require('commander');
const { bold, red } = require('colorette');

(() => {
  return hasApplication() && init();
})();

function getErrorMsg() {
  return console.error(bold(red('No active application detected. Please create a project with the ServiceNow Extension for VS Code.\n\n' +
  'https://docs.servicenow.com/bundle/quebec-application-development/page/build/applications/task/create-project.html')));
}

function getOption(opts) {
  const option = Object.keys(opts).toString();
  const options = {
    build: () => {
      runProgressScript('init');
    },
    compile: () => {
      runScript('compile');
    },
    sync: () => {
      runProgressScript('sync');
    },
    default: () => {
      program.help();
    }
  };
  return (options[option] || options['default'])();
}

function getProgressBar() {
  return new cliProgress.SingleBar({
    format: 'CLI Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
}

function hasApplication() {
  try {
    const workspace = fs.readFileSync('system/sn-workspace.json');
    const app = JSON.parse(workspace).ACTIVE_APPLICATION;
    return Object.entries(app).length === 0 ? getErrorMsg() : true;
  } catch (e) {
    getErrorMsg();
    return process.exit(e.code);
  }
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
  getOption(program.opts());
}

function runProgressScript(file) {
  var bar = getProgressBar();
  bar.start(100, 0);
  return childProcess.exec(
    `${path.join(__dirname, '../scripts')}/${file}.rb`,
    function (stdout) {
      bar.update(100);
      bar.stop();
      return stdout;
    }
  );
}

function runScript(file) {
  return childProcess.exec(
    `${path.join(__dirname, '../scripts')}/${file}.rb`,
    function (stdout) {
      return stdout;
    }
  );
}
