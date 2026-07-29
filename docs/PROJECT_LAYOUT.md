# Sample Application Layout

The ServiceNow Extension for VS Code stores application files in `src`. SN TypeScript Util creates a parallel `ts` working tree for supported JavaScript files while leaving other application assets in place.

```text
application/
├── background scripts/
├── scratch/
├── src/
│   ├── Server Development/
│   │   └── Script Includes/
│   │       ├── DataService.script.js
│   │       └── Utils.script.js
│   └── Service Portal/
│       └── Widgets/
│           └── Dashboard/
│               ├── Dashboard.client_script.js
│               ├── Dashboard.css.scss
│               ├── Dashboard.demo_data.json
│               ├── Dashboard.link.js
│               ├── Dashboard.option_schema.json
│               ├── Dashboard.script.js
│               └── Dashboard.template.html
├── system/
├── ts/
│   ├── Server Development/
│   │   └── Script Includes/
│   │       ├── DataService.script.ts
│   │       └── Utils.script.ts
│   ├── Service Portal/
│   │   └── Widgets/
│   │       └── Dashboard/
│   │           ├── Dashboard.client_script.ts
│   │           ├── Dashboard.link.ts
│   │           └── Dashboard.script.ts
│   └── Types/
│       ├── BaseTable.ts
│       └── User.ts
├── .eslintrc
├── .prettierrc.json
├── app.config.json
└── tsconfig.json
```

In this example:

- Script Includes and executable widget JavaScript have matching TypeScript files under `ts`.
- Stylesheets, templates, and JSON assets remain only under `src` because they are not TypeScript sources.
- `ts/Types` contains shared interfaces and types. A legacy `BaseTable.ts` interface for common runtime record fields is optional and can be created during `snts --build`.
- The root `tsconfig.json` records the ECMAScript target selected during `snts --build`; `.prettierrc.json` is optional.
- `snts --compile` writes compiled JavaScript to the corresponding paths under `src`.
- `snts --sync` adds TypeScript counterparts for new supported JavaScript files without replacing existing files under `ts`.
