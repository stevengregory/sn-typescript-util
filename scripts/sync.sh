#!/bin/bash

clean_build() {
  if [ -d $1 ]; then
    rm -rf $1
  fi
}

get_project_name() {
  echo $(cat $1 \
    | grep $2 \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/["{,~]//g')
}

sync() {
  interface_dir="Interfaces"
  src_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/src"
  ts_path="$(get_project_name system/sn-workspace.json ACTIVE_APPLICATION)/ts"
  clean_build "$build_dir"
  if [ -d "$ts_path" ]; then
    find "$ts_path" -name "*.ts" -exec sh -c 'mv "$0" "${0%.ts}.js"' {} \;
  fi
  rsync --ignore-existing --delete-after -raz --progress --exclude "$interface_dir" "$src_path/" "$ts_path"
  find "$ts_path" -name "*.js" -exec sh -c 'mv "$0" "${0%.js}.ts"' {} \;
}

sync
