# SN TypeScript Util

[![npm version](https://img.shields.io/npm/v/sn-typescript-util)](https://www.npmjs.com/package/sn-typescript-util)

A [TypeScript](https://www.typescriptlang.org/) CLI utility that works on-top of the ServiceNow Extension for VS Code. This tool activates a TypeScript-based workflow for ServiceNow developers using VS Code.

## Table of Contents

1. [Benefits](#benefits)
1. [Prerequisites](#prerequisites)
1. [Installation and Setup](#installation-and-setup)
1. [Basic Workflow](#basic-workflow)
1. [Commands](#commands)
1. [License](#license)

## Benefits

Using TypeScript, the CLI provides an enhanced developer workflow.

- Work in modern JavaScript ES2015 (ES6) and beyond
- Extend JavaScript by using types
- Unlock code navigation and intelligent code completion
- Catch bugs before syncing to the instance

**[Back to top](#table-of-contents)**

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [ServiceNow Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode)
- A [project created](https://docs.servicenow.com/bundle/quebec-application-development/page/build/applications/task/create-project.html#create-project) and [application imported](https://docs.servicenow.com/bundle/quebec-application-development/page/build/applications/task/create-project.html#vscode-import-application) in VS Code

**[Back to top](#table-of-contents)**

## Installation and Setup

Install the npm package.

```bash
npm install -g sn-typescript-util
```

Build the TypeScript and configuration files. This only needs to be done once for an application.

```bash
snts --build
```

In the application directory created by the ServiceNow Extension for VS Code, the build creates a `ts` directory from the JavaScript files in the `src` directory. This is where all the TypeScript code resides and where the workflow begins.

**[Back to top](#table-of-contents)**

## Basic Workflow

After installation & setup, simply run the `watch` script to start looking for TypeScript code changes in the `ts` directory.

```bash
npm run watch
```

Any JavaScript ES2015 (ES6) code added will get converted down to ES5 and moved to the `src` directory. Then changes are ready to sync with the target instance using the ServiceNow Extension for VS Code.

**[Back to top](#table-of-contents)**

## Commands

Installing the CLI globally provides access to the `snts` command.

```sh-session
snts [command]
```

### Build

Build project utility files and package dependencies. Creates a `ts` directory from the JavaScript files in the `src` directory.

```bash
snts --build
```

### Compile

Compile TypeScript files in the `ts` directory to JavaScript ES5 and moves them to the `src` directory.

```bash
snts --compile
```

### Help

Display help for the command.

```bash
snts --help
```

### Sync

Sync new instance-based `src` files to the `ts` directory.

```bash
snts --sync
```

### Version

Output the version number.

```bash
snts --version
```

**[Back to top](#table-of-contents)**

## License

[MIT License](LICENSE)

**[Back to top](#table-of-contents)**
