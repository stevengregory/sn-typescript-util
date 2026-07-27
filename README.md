# SN TypeScript Util

[Introduction](#introduction) • [Benefits](#benefits) • [Getting Started](#getting-started) • [Workflow](#workflow) • [Commands](#commands) • [npm](https://www.npmjs.com/package/sn-typescript-util) • [Homebrew](https://github.com/stevengregory/homebrew-snts)

[![npm version](https://img.shields.io/npm/v/sn-typescript-util)](https://www.npmjs.com/package/sn-typescript-util)
[![node](https://img.shields.io/node/v/sn-typescript-util)](https://nodejs.org/)
[![license](https://img.shields.io/npm/l/sn-typescript-util)](LICENSE)

## Introduction

SN TypeScript Util is a CLI that adds a TypeScript workflow on top of the [ServiceNow Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode).

## Benefits

- Write modern JavaScript with TypeScript types
- Unlock code navigation and intelligent code completion
- Catch bugs before syncing to the instance

## Getting Started

Before starting, import a ServiceNow application into VS Code with the [ServiceNow Extension for VS Code](https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/applications/task/vscode-import-application.html).

### Install

With Homebrew on macOS:

```bash
brew install stevengregory/snts/snts
```

Homebrew installs the required Node.js runtime automatically.

Or install from npm with Node.js 22.12 or later:

```bash
npm install -g sn-typescript-util
```

### Set up an application

From the root of the imported application, run:

```bash
snts --build
```

The build creates a `ts` working directory from the JavaScript files in `src`. It also prompts for an ECMAScript target and optional extras: a `BaseTable.ts` interface with common fields, a Prettier configuration, and Git repository initialization.

## Workflow

Start the TypeScript compiler in watch mode while working in `ts`:

```bash
tsc --watch
```

Compiled JavaScript is moved into `src`, where it is ready to sync to the target instance with the ServiceNow Extension for VS Code. Use `snts --compile` when you prefer a one-time compile.

When new JavaScript files are pulled into `src` from the instance, run `snts --sync` to add their TypeScript counterparts without replacing existing work in `ts`.

## Commands

Installing the CLI provides the `snts` command.

| Command     | Alias | Description                                                        |
| ----------- | ----- | ------------------------------------------------------------------ |
| `--build`   | `-b`  | Build project utility files and create `ts` from the `src` sources |
| `--compile` | `-c`  | Compile TypeScript in `ts` to JavaScript and move it to `src`      |
| `--help`    | `-h`  | Display help for the command                                       |
| `--remove`  | `-r`  | Remove and clean the `ts` build directory                          |
| `--sync`    | `-s`  | Sync new instance-based `src` files to the `ts` directory          |
| `--version` | `-v`  | Output the version number                                          |

## Project Layout

After setup, the important parts of an application look like this:

```text
application/
├── src/                 # JavaScript managed by the ServiceNow extension
├── ts/                  # TypeScript working tree created by snts
│   └── Types/           # Shared interfaces and types
├── system/
└── app.config.json
```

The directory structure under `ts` mirrors supported JavaScript files under `src`, with `.js` files represented as `.ts` files.

See the [full sample application layout](https://github.com/stevengregory/sn-typescript-util/blob/master/docs/PROJECT_LAYOUT.md) for Script Include and Service Portal widget examples.

## License

[MIT License](LICENSE)
