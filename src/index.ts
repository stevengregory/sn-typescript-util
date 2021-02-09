#!/usr/bin/env node

const childProcess = require('child_process');
const path = require('path');
const { description, version } = require('./../package.json');
const { program } = require('commander');

program.description(description);
program.version(version);
program.option('-b, --build', 'build it');
program.option('-c, --compile', 'compile it');
program.option('-s, --sync', 'sync it');
program.parse(process.argv).opts();

const options = program.opts();
if (options.build) {
  childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/build.sh`);
}
if (options.compile) {
  childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/compile.sh`);
}
if (options.sync) {
  childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/sync.sh`);
}

program.help();
