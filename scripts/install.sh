#!/usr/bin/env bash

readonly packages=(
  '@types/servicenow'
  '@types/node'
  'colorette'
  'commander'
  'npm-add-script'
  'nodemon'
  'prettier'
  'typescript'
  'ts-node'
)

for p in "${packages[@]}"
do
  npm i $p -D
done

npm i -g nodemon
npm i -g npm-add-script
npmAddScript -k snts:watch -v "snts -c"
