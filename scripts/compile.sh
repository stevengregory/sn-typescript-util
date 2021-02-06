#!/bin/bash

get_project_name() {
  echo $(cat $1 \
    | grep $2 \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/["{,~]//g')
}

transpile() {
  build_dir="dist"
  interface_dir="Interfaces"
  src_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/src"
  ts_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/ts"
  tsc
  prettier --write "$build_dir/**/*.js"
  rsync -av --progress -a --exclude="$interface_dir" "$build_dir/" "$src_path"
}

transpile
