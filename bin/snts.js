#!/usr/bin/env node
import { $ } from 'execa';
import { Command } from 'commander';
import path from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { bold, cyan, gray, green, magenta, red } from 'colorette';
import { cancel, confirm, intro, isCancel, outro, select, spinner } from '@clack/prompts';
function cancelOperation() {
    cancel('Operation cancelled.');
    process.exit(0);
}
async function addFile(sourcefile, sourceDir, targetFile, targetDir, message) {
    if (await confirmFile(message)) {
        const file = getTargetPath(targetFile, targetDir);
        const filePath = getFilePath(sourcefile, sourceDir);
        createFile(file, filePath);
    }
}
async function addInterfaceFile() {
    return await addFile('base-table.ts', 'src/templates', 'BaseTable.ts', 'ts/Types', `Add a ${cyan('BaseTable.ts')} interface with global default fields?`);
}
async function addPrettierFile() {
    return await addFile('.prettierrc.json', 'src/templates', '.prettierrc.json', null, `Add a ${cyan('.prettierrc.json')} default config?`);
}
async function confirmFile(msg) {
    const result = await confirm({
        message: msg
    });
    if (isCancel(result)) {
        cancelOperation();
    }
    return result;
}
function createFile(file, templatePath) {
    const template = readFileSync(templatePath, 'utf8');
    writeFile(file, template);
}
function createTemplate(file, templatePath) {
    const project = getProject();
    const template = readFileSync(templatePath, 'utf8');
    const data = template.replace(/@project/g, project);
    writeFile(file, data);
}
async function doBuild() {
    intro(`${bold(magenta(getConstants().projectName))}: Build`);
    const esVersion = await getConfigTypes();
    await addInterfaceFile();
    await addPrettierFile();
    await initGitRepo();
    const s = startPrompts('Installing config(s)', null);
    const filePath = getFilePath('tsconfig.json', 'src/templates');
    createTemplate('tsconfig.json', filePath);
    const template = readFileSync('tsconfig.json', 'utf8');
    const data = template.replace(/@version/g, esVersion);
    writeFile('tsconfig.json', data);
    stopPrompt(s, `The ${cyan('tsconfig.json')} file was bootstrapped.`);
    await runSync();
}
async function doClean() {
    const buildDir = path.join(getProject(), 'ts');
    await rm(buildDir, { recursive: true, force: true });
    console.log(`Removed the ${cyan(buildDir)} directory.`);
}
async function doCompile() {
    const s = startPrompts('Processing', 'Compile started');
    try {
        await transpile();
        stopPrompt(s, 'Completed');
    }
    catch (error) {
        stopPrompt(s, 'Compile failed');
        printError(error);
        process.exit(1);
    }
}
function doOptions(program) {
    const options = parseOptions(program);
    if (options.length > 1) {
        console.error(bold(red('Options cannot be combined. Please pass one option at a time.')));
        return process.exit(1);
    }
    const optionKey = options[0];
    return handleOptions(program, getOptions(program), optionKey);
}
async function doSync() {
    const s = startPrompts('Processing', 'Sync started');
    try {
        await runSyncScript();
        stopPrompt(s, 'Completed');
    }
    catch (error) {
        stopPrompt(s, 'Sync failed');
        printError(error);
        process.exit(1);
    }
}
function getConfigTargets() {
    return [
        { value: 'es5', label: 'ES5' },
        { value: 'es6', label: 'ES2015', hint: 'ES6' },
        { value: 'es2021', label: 'ES2021' }
    ];
}
async function getConfigTypes() {
    const result = await select({
        message: 'Please pick a ECMAScript target.',
        options: getConfigTargets()
    });
    if (isCancel(result)) {
        cancelOperation();
    }
    return result;
}
function getConstants() {
    let Constants;
    (function (Constants) {
        Constants["projectName"] = "SN TypeScript Util";
        Constants["projectDescription"] = "is a TS utility for ServiceNow developers using VS Code.";
        Constants["errorMsg"] = "No active application detected. Please create a project with the ServiceNow Extension for VS Code.";
        Constants["docsUrl"] = "https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/applications/task/create-project.html";
        Constants["buildOption"] = "Build project utility files & package dependencies";
        Constants["compileOption"] = "Compile TypeScript files to JavaScript & move to src";
        Constants["helpOption"] = "Display help for command";
        Constants["removeOption"] = "Remove & clean the ts build directory";
        Constants["syncOption"] = "Sync new instance-based src files to the ts directory";
        Constants["versionOption"] = "Output the current version";
    })(Constants || (Constants = {}));
    return Constants;
}
function getDescription(version) {
    const constants = getConstants();
    const title = constants.projectName;
    const description = constants.projectDescription;
    return `${bold(magenta(title))} ${description} ${gray(`(v${version})`)}\n`;
}
function getErrorMsg() {
    const constants = getConstants();
    const msg = `${constants.errorMsg}\n\n${constants.docsUrl}`;
    return console.error(bold(red(msg)));
}
function getFilePath(file, dir) {
    const fileName = fileURLToPath(import.meta.url);
    const dirName = path.dirname(fileName);
    return path.join(dirName, '..', dir, file);
}
function getOptions(program) {
    return {
        build: () => doBuild(),
        compile: () => doCompile(),
        help: () => showHelp(program),
        remove: () => doClean(),
        sync: () => doSync(),
        default: () => showHelp(program)
    };
}
function getPackageInfo() {
    return JSON.parse(readFileSync(getFilePath('package.json', '.'), 'utf8'));
}
function getProject() {
    const workspace = getWorkspace();
    return workspace.ACTIVE_APPLICATION;
}
function getTargetPath(file, dir) {
    const project = getProject();
    const targetDir = dir ? path.join(project, dir) : '.';
    if (dir && !existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }
    return path.join(targetDir, file);
}
function getVersion() {
    const info = getPackageInfo();
    return info.version;
}
function getWorkspace() {
    return JSON.parse(readFileSync('./system/sn-workspace.json', 'utf8'));
}
async function handleOptions(program, options, option) {
    if (!option || option === 'help') {
        const version = getVersion();
        console.log(getDescription(version));
        return showHelp(program);
    }
    if (!hasApplication()) {
        return process.exit(1);
    }
    return await options[option]();
}
function hasApplication() {
    try {
        if (getWorkspace().ACTIVE_APPLICATION.length > 0) {
            return true;
        }
        getErrorMsg();
    }
    catch {
        getErrorMsg();
    }
    return false;
}
try {
    await init();
}
catch (error) {
    printError(error);
    process.exit(1);
}
async function init() {
    const program = new Command();
    const constants = getConstants();
    const version = getVersion();
    program.option('-b, --build', constants.buildOption);
    program.option('-c, --compile', constants.compileOption);
    program.option('-h, --help', constants.helpOption);
    program.option('-r, --remove', constants.removeOption);
    program.option('-s, --sync', constants.syncOption);
    program.version(version, '-v, --version', constants.versionOption);
    program.usage(cyan('[options]'));
    return doOptions(program);
}
async function initGitRepo() {
    const msg = `Initialize a new git repository?`;
    return (await confirmFile(msg)) && (await $ `git init`);
}
function parseOptions(program) {
    return Object.keys(program.parse(process.argv).opts());
}
function printError(error) {
    const { stdout, stderr, message } = (error ?? {});
    const output = [stdout, stderr].filter(Boolean).join('\n');
    console.error(output || bold(red(message ?? String(error))));
}
async function runSync() {
    const project = getProject();
    const s = startPrompts('Syncing', null);
    try {
        await runSyncScript();
        stopPrompt(s, `TypeScript files constructed in the ${cyan(project + '/ts')} directory.`);
        outro(`${green('Done!')}`);
    }
    catch (error) {
        stopPrompt(s, 'Sync failed');
        printError(error);
        process.exit(1);
    }
}
async function runSyncScript() {
    return await $ `${getFilePath('sync.sh', 'scripts')}`;
}
function showHelp(program) {
    return program.help();
}
function startPrompts(start, introMsg) {
    if (introMsg) {
        intro(introMsg);
    }
    const s = spinner();
    s.start(start);
    return s;
}
function stopPrompt(spinner, msg) {
    return spinner.stop(msg);
}
async function transpile() {
    const tscPath = getFilePath('tsc', 'node_modules/.bin');
    return await $ `${tscPath}`;
}
function writeFile(file, data) {
    writeFileSync(file, data, { encoding: 'utf8' });
}
