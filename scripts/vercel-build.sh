#!/usr/bin/env bash
# Vercel build: firmware binary + dashboard -> bridge/_vercel_public (bundled into the Python serverless app).
# Do NOT copy the SPA into ./public: Vercel serves public/** from the edge first; unmatched paths can 404 as
# {"detail":"Not Found"} without ever reaching FastAPI. Serving the UI from bridge/_vercel_public keeps /,
# /assets/*, /health, and /pa/* on the same serverless app (see bridge/api.py).
# If your Vercel project has "Output Directory" set to `public`, clear it for this repo.
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

echo "Vercel build OK: dashboard -> bridge/_vercel_public/ (SPA for FastAPI only), bridge/protocol_analyzer, firmware -> firmware/bin/protocol_analyzer"
