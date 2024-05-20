# SN TypeScript Util

[![npm version](https://img.shields.io/npm/v/sn-typescript-util)](https://www.npmjs.com/package/sn-typescript-util)

A [TypeScript](https://www.typescriptlang.org/) CLI utility that works on-top of the ServiceNow Extension for VS Code. This tool activates a TypeScript-based workflow for ServiceNow developers using VS Code.

## Table of Contents

1. [Benefits](#benefits)
1. [Prerequisites](#prerequisites)
1. [Installation and Setup](#installation-and-setup)
1. [Basic Workflow](#basic-workflow)
1. [Commands](#commands)
1. [Project Structure](#project-structure)
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
- [ServiceNow Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ServiceNow.now-vscode)
- An [imported application](https://docs.servicenow.com/bundle/washingtondc-application-development/page/build/applications/task/vscode-import-application.html) in VS Code

**[Back to top](#table-of-contents)**

## Installation and Setup

Install the npm package.

```bash
npm install -g sn-typescript-util
```

Build the TypeScript and configuration files. This only needs to be done once for an application.

```bash
snts -b
```

In the application directory created by the ServiceNow Extension for VS Code, the build creates a `ts` directory from the JavaScript files in the `src` directory. This is where all the TypeScript code resides and where the workflow begins.

**[Back to top](#table-of-contents)**

## Basic Workflow

After installation & setup, simply run the TypeScript compiler `--watch` command to start looking for TypeScript code changes in the `ts` directory.

```bash
tsc --watch
```

The TypeScript will get transpiled and moved to the `src` directory. Then changes are ready to sync with the target instance using the ServiceNow Extension for VS Code.

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

# or

snts -b
```

### Compile

Compile TypeScript files in the `ts` directory to JavaScript ES5 and moves them to the `src` directory.

```bash
snts --compile

# or

snts -c
```

### Help

Display help for the command.

```bash
snts --help

# or

snts -h
```

### Remove

Remove & clean the `ts` build directory.

```bash
snts --remove

# or

snts -r
```

### Sync

Sync new instance-based `src` files to the `ts` directory.

```bash
snts --sync

# or

snts -s
```

### Version

Output the version number.

```bash
snts --version

# or

snts -v
```

**[Back to top](#table-of-contents)**

## Project Structure

Inside of the application directory (after the build), the project structure will look something like this.

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

This example project has two script includes, a widget, and a `Types` directory for interfaces & types.

**[Back to top](#table-of-contents)**

## License

[MIT License](LICENSE)

**[Back to top](#table-of-contents)**
