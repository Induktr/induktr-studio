#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bun format
bun lint
bun prisma generate
bun typecheck