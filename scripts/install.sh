#!/usr/bin/env bash

readonly packages=(
  '@types/servicenow'
  '@types/node'
  'commander'
  'npm-add-script'
  'nodemon'
  'prettier'
  'typescript'
  'ts-node'
)

for p in "${packages[@]}"
do
  npm i $p -g
  npm i $p -D
done

npmAddScript -k snt:watch -v "snt -c"
