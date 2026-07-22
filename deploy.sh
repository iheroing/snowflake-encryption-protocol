#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

echo "Snowflake Whisper release gate"
echo "Running locked install, tests, protocol vector, build, and dependency audit..."

npm ci
npm run check:release

echo
echo "Local release gate passed."
echo "Production deployment is intentionally not automatic."
echo "Verify the three required Vercel variables, then follow DEPLOYMENT.md:"
echo "  UPSTASH_REDIS_REST_URL"
echo "  UPSTASH_REDIS_REST_TOKEN"
echo "  RATE_LIMIT_SALT"
