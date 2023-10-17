#!/usr/bin/env bash

bump_version() {
  version=$(npm version "$1" --no-git-tag-version)
  echo "version bumped to $version"
  do_git_operation
}

do_git_operation() {
  git commit -a -m "chore: bump the version"
  git tag $(get_package_version)
  git push
  git push origin $(get_package_version)
}

get_package_version() {
  version=`node -p "require('./package.json').version"`
  echo "v$version"
}

bump_version "$1"
