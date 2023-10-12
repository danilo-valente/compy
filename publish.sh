#!/usr/bin/env bash

# Validate arguments

version="$1"
version=`[ "${version::1}" = 'v' ] && echo "${version:1}" || echo "${version}"`

if [ -z "${version}" ]; then
  echo "You must specify a version number."
  exit 1
fi

version_desc="$2"

if [ -z "${version_desc}" ]; then
  echo "You must specify a version description."
  exit 1
fi

version_tag="v$version"

# Check jq

if ! [ -x "$(command -v jq)" ]; then
  echo "jq is not installed. Please install jq."
  exit 1
fi

# Check git branch

remote="origin"
main_branch=`git remote show $remote | sed -n '/HEAD branch/s/.*: //p'`
cur_branch=`git rev-parse --abbrev-ref HEAD`

if [ "${cur_branch}" != "${main_branch}" ]; then
  echo "You must be on the $main_branch branch to publish."
  exit 1
fi

# Check for info file

info_file="info.json"

if [ ! -f "${info_file}" ]; then
    echo "File $info_file not found in current directory! Are you sure you're in the root of the project?"
fi

# Check for existing tag

if [ -n "`git tag -l $version_tag`" ]; then
  echo "Version $version_tag already exists."
  exit 1
fi

# Check for uncommitted changes

if [ ! -z "`git status -uno --porcelain`" ]; then
  echo "Uncommitted changes. Please commit or stash before publishing."
  exit 1
fi

# Deno Check & Test

check=`deno check mod.ts run.ts types.ts`
[ $? -ne 0 ] && echo "Deno Check failed." && exit 1

# if [ $? -ne 0 ]; then
#   echo "Tests failed."
#   exit 1
# fi

test=`deno test`
[ $? -ne 0 ] && echo "Deno Tests failed." && exit 1

# if [ $? -ne 0 ]; then
#   echo "Tests failed."
#   exit 1
# fi

# Create release commit

info=`cat $info_file`
echo $info | jq --arg version "$version" '.version = $version' > "$info_file"

git add "$info_file"

git commit -m "release($version_tag): $version_desc"

# Tag

git tag "$version_tag"

if [ $? -eq 0 ]; then
  echo "Tagged $version_tag."
else
  echo "Failed to tag $version_tag."
  exit 1
fi

# Publish

if [ "${PUBLISH}" -eq 1 ]; then
  git push "$remote" "$main_branch"
  git push "$remote" --tags
fi
