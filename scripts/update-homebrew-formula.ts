import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const formulaPath = path.join(projectRoot, 'Formula', 'snts.rb');

interface NpmPackageInfo {
  version: string;
  dist: {
    tarball: string;
  };
}

async function fetchPackageInfo(version?: string): Promise<NpmPackageInfo> {
  const endpoint = version
    ? `https://registry.npmjs.org/sn-typescript-util/${version}`
    : 'https://registry.npmjs.org/sn-typescript-util/latest';
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`
    );
  }
  return (await response.json()) as NpmPackageInfo;
}

async function sha256ForUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`
    );
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  return createHash('sha256').update(bytes).digest('hex');
}

function updateFormula(contents: string, version: string, sha256: string) {
  if (
    !/url "https:\/\/registry\.npmjs\.org\/sn-typescript-util\/-\/sn-typescript-util-[^"]+\.tgz"/.test(
      contents
    ) ||
    !/sha256 "[a-f0-9]{64}"/.test(contents)
  ) {
    throw new Error(
      'Formula/snts.rb did not contain a recognizable url/sha256 pair to update.'
    );
  }

  return contents
    .replace(
      /url "https:\/\/registry\.npmjs\.org\/sn-typescript-util\/-\/sn-typescript-util-[^"]+\.tgz"/,
      `url "https://registry.npmjs.org/sn-typescript-util/-/sn-typescript-util-${version}.tgz"`
    )
    .replace(/sha256 "[a-f0-9]{64}"/, `sha256 "${sha256}"`);
}

async function main() {
  const requestedVersion = process.argv[2];
  const info = await fetchPackageInfo(requestedVersion);
  const sha256 = await sha256ForUrl(info.dist.tarball);
  const current = readFileSync(formulaPath, 'utf8');
  const next = updateFormula(current, info.version, sha256);
  writeFileSync(formulaPath, next);
  console.log(`Updated Formula/snts.rb to ${info.version}`);
  console.log(`sha256 ${sha256}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
