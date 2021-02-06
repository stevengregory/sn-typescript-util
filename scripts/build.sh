#!/bin/bash

create_prettier_config() {
  echo '
  {
    "trailingComma": "none",
    "tabWidth": 2,
    "semi": true,
    "singleQuote": true
  }'
}

craft_tsconfig_template() {
  echo '
  {
    "compilerOptions": {
    "target": "es5",
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "*": ["./lib/dts/index.d.ts"]
    }
  },
    "include": ["./@project/ts/**/*", "./lib/dts/index.d.ts", "./@project/ts/Interfaces/*.ts"]
  }'
}

get_project_name() {
  echo $(cat $1 \
    | grep $2 \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/["{,~]//g')
}

install_packages() {
  npm i typescript --save
  npm i @types/servicenow prettier watch -D
}

make_prettier_file() {
  prettier_config=".prettierrc.json"
  touch "$prettier_config"
  echo $(create_prettier_config) > "$prettier_config"
  prettier --write "$prettier_config"
}

make_tsconfig_file() {
  tsconfig_file="tsconfig.json"
  project="$(get_project_name ./system/sn-workspace.json ACTIVE_APPLICATION)"
  touch "$tsconfig_file"
  echo $(craft_tsconfig_template) > "$tsconfig_file"
  replace_content @project "$project" "$tsconfig_file"
  prettier --write "$tsconfig_file"
}

replace_content() {
  sed -i '' -e "s/${1}/${2}/g" ${3}
}

install_packages
make_tsconfig_file
make_prettier_file
