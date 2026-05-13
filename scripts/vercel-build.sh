#!/usr/bin/env bash
# Vercel build: firmware binary + dashboard -> bridge/_vercel_public (bundled into the Python serverless app).
# Also copies dist -> ./public when the Vercel project has "Output Directory" = public (otherwise the build errors).
# Do NOT add "outputDirectory": "public" to vercel.json — that makes a static-only deploy; /health and /pa/* get NOT_FOUND.
# FastAPI serves /, /assets, /pa/*, /health from _vercel_public (see bridge/api.py).
# If the builder has no gcc, copies deploy/vercel/protocol_analyzer_linux_amd64 (refresh after C changes).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if command -v make >/dev/null 2>&1 && command -v gcc >/dev/null 2>&1; then
  make -C firmware all || true
fi

BIN="${ROOT}/firmware/bin/protocol_analyzer"
if [[ ! -x "$BIN" ]]; then
  PRE="${ROOT}/deploy/vercel/protocol_analyzer_linux_amd64"
  if [[ -f "$PRE" ]]; then
    mkdir -p firmware/bin
    cp "$PRE" "$BIN"
    chmod +x "$BIN"
  else
    echo "Missing firmware binary and prebuilt at ${PRE}" >&2
    exit 1
  fi
fi

cd "${ROOT}/dashboard"
npm ci
VITE_API_URL=relative npm run build

rm -rf "${ROOT}/bridge/_vercel_public"
cp -r dist "${ROOT}/bridge/_vercel_public"

rm -rf "${ROOT}/public"
mkdir -p "${ROOT}/public"
cp -r dist/. "${ROOT}/public/"

echo "Vercel build OK: dashboard -> bridge/_vercel_public/ + public/, firmware -> firmware/bin/protocol_analyzer"
