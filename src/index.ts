#!/usr/bin/env node

const childProcess = require('child_process');
const path = require('path');
const { description, version } = require('./../package.json');
const { program } = require('commander');

(() => {
  program.description(description);
  program.version(version);
  program.option(
    '-b, --build',
    'Build project utility files & package dependencies'
  );
  program.option(
    '-c, --compile',
    'Compile TypeScript files to JavaScript & move to src'
  );
  program.option(
    '-s, --sync',
    'Sync new instance-based src files to the ts directory'
  );
  program.parse(process.argv).opts();
  getOption(program.opts());
})();

function getOption(opts) {
  const option = Object.keys(opts).toString();
  const options = {
    build: () => {
      childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/build.sh`);
    },
    compile: () => {
      childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/compile.sh`);
    },
    sync: () => {
      childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/sync.sh`);
    },
    default: () => {
      program.help();
    }
  };
  return (options[option] || options['default'])();
}
