#!/usr/bin/env bash
# Vercel build: firmware binary + dashboard -> bridge/_vercel_public (bundled into the Python serverless app).
# Also fills ./public for Vercel projects with "Output Directory" = public (build validation).
# Do not put "outputDirectory": "public" in vercel.json (static-only deploy breaks /health and /pa/*).
# Full dist -> public/ restores CDN-served UI; FastAPI still handles /health and /pa when those routes hit the function.
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

# Co-locate ELF next to bridge/api.py so Vercel's Python bundle includes it (vercel.json `functions` only matches api/**).
cp -f "$BIN" "${ROOT}/bridge/protocol_analyzer"
chmod +x "${ROOT}/bridge/protocol_analyzer"

cd "${ROOT}/dashboard"
npm ci
VITE_API_URL=relative npm run build

rm -rf "${ROOT}/bridge/_vercel_public"
cp -r dist "${ROOT}/bridge/_vercel_public"

rm -rf "${ROOT}/public"
mkdir -p "${ROOT}/public"
cp -r dist/. "${ROOT}/public/"

echo "Vercel build OK: dashboard -> bridge/_vercel_public/ + public/ (full dist), bridge/protocol_analyzer, firmware -> firmware/bin/protocol_analyzer"
