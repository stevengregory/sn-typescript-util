# Releasing SN TypeScript Util

This is the maintainer workflow for publishing the npm package and updating the dedicated Homebrew tap.

## Prerequisites

- Start from a clean `master` branch.
- Authenticate the GitHub CLI with `gh auth login`.
- Authenticate npm with `npm login`.
- Install Bun and the project dependencies.

## Release npm package

Run:

```bash
bun run release
```

The command follows the protected-branch workflow:

1. If the current package version is already tagged and published, select the next version. The command creates a `release/vX.Y.Z` branch and opens a version-bump pull request.
2. Review and merge the pull request.
3. Run `bun run release` again from `master`. The command pulls the merged version, validates the package, pushes its tag, and publishes it to npm.

An interrupted publish is resumable by running the same command again. Inspect the current tag and registry state with:

```bash
bun run release:status
```

Preview a release without changing anything with:

```bash
bun run release --type patch --yes --dry-run
```

## Update Homebrew

After npm confirms the new version is available, update the formula URL and SHA-256 checksum in the dedicated [`stevengregory/homebrew-snts`](https://github.com/stevengregory/homebrew-snts) tap.

Before pushing the formula update, run:

```bash
brew style Formula/snts.rb
brew audit --strict --online --formula stevengregory/snts/snts
brew livecheck stevengregory/snts/snts
brew test --force stevengregory/snts/snts
```
