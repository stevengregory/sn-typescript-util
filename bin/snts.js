#!/usr/bin/env node
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, magenta, red } from 'colorette';
import { intro, outro, spinner } from '@clack/prompts';
async function doBuild() {
    const s = startPrompts('Installing configs', 'Build started');
    return await execFile(getFilePath('init.rb', 'scripts/build'), (stdout) => {
        stopPrompt(s, 'Configs installed');
        runSync();
        return stdout;
    });
}
async function doCompile() {
    const s = startPrompts('Processing', 'Compile started');
    return await execFile(getFilePath('compile.rb', 'scripts/build'), (stdout) => {
        stopPrompt(s, 'Completed');
        return stdout;
    });
}
function doOptions(program, version) {
    program.parse(process.argv).opts();
    const option = Object.keys(program.opts()).toString();
    const optionKey = option;
    const options = {
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
    return handleOptions(program, options, optionKey, version);
}
async function doSync() {
    const s = startPrompts('Processing', 'Sync started');
    return await execFile(getFilePath('sync.sh', 'scripts/build'), (stdout) => {
        stopPrompt(s, 'Completed');
        return stdout;
    });
}
function getDescription(version) {
    const title = 'SN TypeScript Util';
    const description = 'is a TS utility for ServiceNow developers using VS Code.';
    return `${bold(magenta(title))} ${description} ${gray(`(v${version})`)}\n`;
}
function getErrorMsg() {
    const url = `https://docs.servicenow.com/bundle/vancouver-application-development/page/build/applications/task/create-project.html`;
    const msg = `No active application detected. Please create a project with the ServiceNow Extension for VS Code.\n\n${url}`;
    return console.error(bold(red(msg)));
}
function getFilePath(file, dir = 'scripts/build') {
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
function handleError() {
    getErrorMsg();
    return process.exit(1);
}
function handleOptions(program, options, option, version) {
    if (option === 'help' || !option) {
        console.log(getDescription(version));
        showHelp(program);
    }
    return (shouldShowHelp(program, option) ||
        ((hasApplication() && options[option]) || showHelp(program))());
}
async function hasApplication() {
    try {
        const workspace = await getWorkspace();
        const app = workspace.ACTIVE_APPLICATION;
        return Object.entries(app).length === 0 ? getErrorMsg() : true;
    }
    catch {
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
    program.option('-b, --build', 'build project utility files & package dependencies');
    program.option('-c, --compile', 'compile TypeScript files to JavaScript & move to src');
    program.option('-h, --help', 'display help for command');
    program.option('-s, --sync', 'sync new instance-based src files to the ts directory');
    program.version(version, '-v, --version', 'output the current version');
    program.usage(cyan('[options]'));
    return doOptions(program, version);
}
function introPrompt(msg) {
    return intro(msg);
}
async function runSync() {
    const s = startPrompts('Syncing', null);
    return await execFile(getFilePath('sync.sh', 'scripts/build'), (stdout) => {
        stopPrompt(s, 'Sync completed');
        outro('Completed');
        return stdout;
    });
}
function shouldShowHelp(program, option) {
    return !option && showHelp(program);
}
function showHelp(program) {
    return program.help();
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
