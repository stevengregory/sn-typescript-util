#!/usr/bin/env node

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const nodemon = require('nodemon');
const { description, version } = require('./../package.json');
const { program } = require('commander');
const { bold, red } = require('colorette');

const runScript = (file) => {
  return childProcess.exec(`${path.join(__dirname, '../scripts')}/${file}.rb`, function (stdout) {
    return stdout;
  });
}

const getOption = (opts) => {
  const option = Object.keys(opts).toString();
  const options = {
    build: () => {
      runScript('init');
    },
    compile: () => {
      runScript('compile');
    },
    sync: () => {
      runScript('sync');
    },
    watch: () => {
      childProcess.exec('nodemon')
    },
    default: () => {
      program.help();
    }
  };
  return (options[option] || options['default'])();
};

const getErrorMsg = () => {
  return console.error(bold(red('No active application detected. Please create a project with the ServiceNow Extension for VS Code.\n\n' +
  'https://docs.servicenow.com/bundle/quebec-application-development/page/build/applications/task/create-project.html')));
};

const hasApplication = () => {
  try {
    const workspace = fs.readFileSync('system/sn-workspace.json');
    const app = JSON.parse(workspace).ACTIVE_APPLICATION;
    return Object.entries(app).length === 0 ? getErrorMsg(): true;
  } catch(e) {
    getErrorMsg();
    return process.exit(e.code);
  }
};

const init = () => {
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
  program.option(
    '-w, --watch',
    'watch TypeScript files & compile changes'
  );
  program.parse(process.argv).opts();
  getOption(program.opts());
};

(() => {
  return hasApplication() && init();
})();
