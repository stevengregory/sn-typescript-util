#!/usr/bin/env node

var childProcess = require('child_process');
var path = require('path');

childProcess.exec(`sh ${path.join(__dirname, '../scripts')}/build.sh`);
