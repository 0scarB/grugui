#!/usr/bin/env sh

set -eu

python3 -m http.server -d . -b 'localhost' 8080

