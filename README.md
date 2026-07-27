# SN TypeScript Util

[![npm version](https://img.shields.io/npm/v/sn-typescript-util)](https://www.npmjs.com/package/sn-typescript-util)
[![node](https://img.shields.io/node/v/sn-typescript-util)](https://nodejs.org/)
[![license](https://img.shields.io/npm/l/sn-typescript-util)](LICENSE)

A [TypeScript](https://www.typescriptlang.org/) CLI utility that works on top of the ServiceNow Extension for VS Code, activating a TypeScript-based workflow for ServiceNow developers.

## Benefits

- Work in modern JavaScript ES2015 (ES6) and beyond
- Extend JavaScript by using types
- Unlock code navigation and intelligent code completion
- Catch bugs before syncing to the instance

## Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or later
- [ServiceNow Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode)
- An [imported application](https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/applications/task/vscode-import-application.html) in VS Code

## Installation and Setup

Install with npm:

```bash
npm install -g sn-typescript-util
```

Or with Homebrew:

```bash
brew tap stevengregory/sn-typescript-util https://github.com/stevengregory/sn-typescript-util
brew install snts
```

Build the TypeScript and configuration files. This only needs to be done once per application.

```bash
snts -b
```

The build prompts you to select an ECMAScript target (ES5, ES2015, ES2021) and to configure optional extras: a `BaseTable.ts` interface with global default fields, a `.prettierrc.json` config, and git repository initialization.

In the application directory created by the ServiceNow Extension for VS Code, the build creates a `ts` directory from the JavaScript files in the `src` directory. This is where all the TypeScript code resides and where the workflow begins.

## Basic Workflow

After setup, run the TypeScript compiler in watch mode to pick up changes in the `ts` directory.

```bash
tsc --watch
```

The TypeScript is transpiled and moved to the `src` directory — or use `snts -c` for a one-time compile. Changes are then ready to sync to the target instance with the ServiceNow Extension for VS Code.

## Commands

Installing the CLI globally provides the `snts` command.

| Command     | Alias | Description                                                        |
| ----------- | ----- | ------------------------------------------------------------------ |
| `--build`   | `-b`  | Build project utility files and create `ts` from the `src` sources |
| `--compile` | `-c`  | Compile TypeScript in `ts` to JavaScript and move it to `src`      |
| `--help`    | `-h`  | Display help for the command                                       |
| `--remove`  | `-r`  | Remove and clean the `ts` build directory                          |
| `--sync`    | `-s`  | Sync new instance-based `src` files to the `ts` directory          |
| `--version` | `-v`  | Output the version number                                          |

## Project Structure

After the build, the application directory will look something like this.

```text
/
├── background scripts/
├── scratch/
├── src/
│   ├── Server Development/
│   │   └── Script Includes/
│   │       └── DataService.script.js
│   │       └── Utils.script.js
│   └── Service Portal/
│       └── Widgets/
│           └── Dashboard/
│               └── Dashboard.client_script.js
│               └── Dashboard.css.scss
│               └── Dashboard.demo_data.json
│               └── Dashboard.link.js
│               └── Dashboard.option_schema.json
│               └── Dashboard.script.js
│               └── Dashboard.template.html
├── system/
├── ts/
│   ├── Server Development/
│   │   └── Script Includes/
│   │       └── DataService.script.ts
│   │       └── Utils.script.ts
│   ├── Service Portal/
│   │   └── Widgets/
│   │       └── Dashboard/
│   │           └── Dashboard.client_script.ts
│   │           └── Dashboard.link.ts
│   │           └── Dashboard.script.ts
│   └── Types/
│       └── BaseTable.ts
│       └── User.ts
├── .eslintrc
└── app.config.json
```

This example project has two script includes, a widget, and a `Types` directory for interfaces and types.

## Releasing

Maintainers release from a clean `master` branch with authenticated GitHub and npm CLIs:

```bash
bun run release
```

The command follows the protected-branch workflow automatically:

1. If the current package version is already tagged and published, select the next version. The command creates a `release/vX.Y.Z` branch and opens a version-bump pull request.
2. Review and merge that pull request.
3. Run `bun run release` again from `master`. The command pulls the merged version, validates the package, pushes its tag, and publishes it to npm.

An interrupted publish is resumable by running the same command again. Use `bun run release:status` to inspect the current tag and registry state, or preview a release without changing anything:

```bash
bun run release --type patch --yes --dry-run
```

After the npm package is published, refresh the Homebrew formula checksums:

```bash
bun run formula:update
```

Commit the updated `Formula/snts.rb` so `brew upgrade snts` picks up the new release.

## License

[MIT License](LICENSE)
