#!/usr/bin/env bash

readonly packages=(
  'nodemon'
  'npm-add-script'
  'typescript'
)

for p in "${packages[@]}"
do
  npm i -g $p
done

npmAddScript -k watch -v "nodemon --exec snts -c"
