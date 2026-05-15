#!/usr/bin/env bash
# Vercel build: firmware binary + dashboard -> bridge/_vercel_public (Python bundle) and public/ (edge static).
# vercel.json uses routes: filesystem first, then catch-all to app.py so public/index.html serves / and /pa/* hits FastAPI.
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

echo "Vercel build OK: dashboard -> bridge/_vercel_public/ + public/, bridge/protocol_analyzer, firmware -> firmware/bin/protocol_analyzer"
