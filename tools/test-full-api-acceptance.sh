#!/usr/bin/env bash

set -euo pipefail

API_MODE=acceptance ./tools/test-full-api.sh "$@"
