#!/usr/bin/env bash
# Prints env var names to set in Vercel (no secrets).
set -euo pipefail

cat <<'EOF'
Set these in Vercel → Project → Settings → Environment Variables (Production + Preview):

DATABASE_URL     Session pooler URI (port 6543, ?pgbouncer=true) from Supabase Connect
DIRECT_URL       Direct URI (port 5432) — same password; used only for prisma migrate locally
SESSION_SECRET   openssl rand -base64 32
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Do NOT add service_role to Vercel unless you add server-only API routes that need it.

After first deploy, open your *.vercel.app URL and log in with admin@tms.local / password123
EOF
