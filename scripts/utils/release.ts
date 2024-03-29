import { $ } from 'bun';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { cancel, confirm, intro, outro, select, spinner } from '@clack/prompts';
import { Version } from './../types/version.js';

async function bumpVersion(releaseType) {
  return await $`npm version ${releaseType} --no-git-tag-version`;
}

async function cancelOperation() {
  cancel('Operation cancelled.');
  await $`git checkout package.json`;
}

async function confirmVersion(version: string) {
  return await confirm({
    message: `Bump to ${version}?`
  });
}

async function doGitOperation(version: string) {
  const msg = 'chore: bump the version';
  await $`git commit -a -m ${msg}`;
  await $`git tag ${version}`;
  await $`git push`;
  await $`git push origin ${version}`;
}

async function doOperation(shouldContinue: boolean | symbol, version: string) {
  if (shouldContinue) {
    const s = spinner();
    s.start('Start release');
    await doGitOperation(version);
    await doPublish();
    s.stop('Done.');
    outro("You're all set!");
  } else {
    cancelOperation();
  }
}

async function doPublish() {
  return await $`npm publish`;
}

function getFilePath(file: string, dir: string) {
  const fileName = fileURLToPath(import.meta.url);
  const dirName = path.dirname(fileName);
  return `${path.join(dirName, `./../../${dir}`)}/${file}`;
}

async function getPackageInfo() {
  return JSON.parse(readFileSync(getFilePath('package.json', '.')).toString());
}

async function getReleaseTypes() {
  return select({
    message: 'Please pick a release type.',
    options: getOptions()
  });
}

function getOptions(): Version[] {
  return [
    { value: 'patch', label: 'Patch' },
    { value: 'minor', label: 'Minor' },
    { value: 'major', label: 'Major' }
  ];
}

async function getVersion() {
  const file = await getPackageInfo();
  return `v${file.version}`;
}

(async function init() {
  intro('Release Utils');
  const releaseType = await getReleaseTypes();
  const version = (await bumpVersion(releaseType)) && (await getVersion());
  const shouldContinue = await confirmVersion(version);
  return await doOperation(shouldContinue, version);
})();
