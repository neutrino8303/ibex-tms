#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]] || [[ "${DATABASE_URL}" == file:* ]]; then
  echo "Set DATABASE_URL in .env to your Supabase Postgres URI (see .env.example)."
  echo "Project: gnaoybndpgbajnfntqmy"
  exit 1
fi

echo "Applying migrations to Supabase…"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
echo "Seeding database…"
pnpm exec tsx prisma/seed.ts
echo "Done."
