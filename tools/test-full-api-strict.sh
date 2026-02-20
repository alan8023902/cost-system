#!/usr/bin/env bash

set -euo pipefail

API_MODE=strict ./tools/test-full-api.sh "$@"
