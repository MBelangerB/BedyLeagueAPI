#!/bin/sh
set -e

# MAJ des package NPM
npm install 

# MAJ de BD
npm run migrate:up

# Setting
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ]; then
  set -- node "$@"
fi

exec "$@"