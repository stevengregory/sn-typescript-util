#!/usr/bin/env bash

readonly packages=(
  'npm-add-script'
  'typescript'
)

for p in "${packages[@]}"
do
  npm i -g $p
done

npmAddScript -k watch -v "tsc --watch"
