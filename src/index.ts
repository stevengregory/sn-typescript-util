#!/usr/bin/env node

const childProcess = require('child_process');
const path = require('path');
const { description, version } = require('./../package.json');
const { program } = require('commander');

const runBash = (file) => {
  return childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/${file}.sh`);
};

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
      runBash('sync');
    },
    default: () => {
      program.help();
    }
  };
  return (options[option] || options['default'])();
};

(() => {
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
})();
