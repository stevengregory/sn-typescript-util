#!/usr/bin/env node
import { Command } from 'commander';
import { execFile } from 'node:child_process';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { bold, red } from 'colorette';
import { intro, outro, spinner } from '@clack/prompts';
const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
async function doSync() {
    const s = startPrompts('Processing', 'Sync started');
    return await execFile(getFilePath('sync.sh'), (stdout) => {
        stopPrompt(s, 'Completed');
        return stdout;
    });
}
async function getBuildName() {
    const defaultBuild = 'utah';
    try {
        const workspace = await getWorkspaceFile();
        const app = workspace.ACTIVE_APPLICATION;
        const build = workspace.ALL_APPLICATIONS[app].BUILD_NAME;
        return Object.entries(build).length !== 0
            ? build.toLowerCase()
            : defaultBuild;
    }
    catch (e) {
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
    return (options[option] || options['default'])();
}
async function getPackageInfo() {
    return JSON.parse(readFileSync('./package.json').toString());
}
async function getWorkspaceFile() {
    return JSON.parse(readFileSync('./system/sn-workspace.json').toString())
        .ACTIVE_APPLICATION;
}
async function hasApplication() {
    try {
        const workspace = await getWorkspaceFile();
        return Object.entries(workspace).length === 0 ? getErrorMsg() : true;
    }
    catch (e) {
        getErrorMsg();
        return process.exit(1);
    }
}
(async () => {
    return init();
})();
async function init() {
    const info = await getPackageInfo();
    program.description(info.description);
    program.version(info.version);
    program.option('-b, --build', 'build project utility files & package dependencies');
    program.option('-c, --compile', 'compile TypeScript files to JavaScript & move to src');
    program.option('-s, --sync', 'sync new instance-based src files to the ts directory');
    program.parse(process.argv).opts();
    return hasApplication() && getOption(program.opts());
}
function introPrompt(msg) {
    return intro(msg);
}
async function runInstall() {
    const s = startPrompts('Installing packages', null);
    return await execFile(getFilePath('install.sh'), (stdout) => {
        stopPrompt(s, 'Packages installed');
        outro('Completed');
        return stdout;
    });
}
async function runSync() {
    return await execFile(getFilePath('sync.sh'), (stdout) => {
        runInstall();
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
