#!/usr/bin/env bash

get_project_name() {
  echo $(cat $1 \
    | grep $2 \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/["{,~]//g')
}

sync() {
  types_dir="Types"
  src_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/src"
  ts_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/ts"
  if [ -d "$ts_path" ]; then
    find "$ts_path" -name "*.ts" -exec sh -c 'mv "$0" "${0%.ts}.js"' {} \;
  fi
  sources=("$src_path/")
  if [ -d "$types_dir" ]; then
    sources=("$types_dir" "${sources[@]}")
  fi
  rsync --ignore-existing --delete-after -raz --progress --prune-empty-dirs --include "*/" --include "*.js" --exclude="*" "${sources[@]}" "$ts_path"
  find "$ts_path" -name "*.js" -exec sh -c 'mv "$0" "${0%.js}.ts"' {} \;
}

sync
