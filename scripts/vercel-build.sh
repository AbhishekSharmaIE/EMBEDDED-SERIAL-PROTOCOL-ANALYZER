#!/usr/bin/env bash
# Vercel: dashboard build -> bridge/_vercel_public (ships with Python) + public/ (edge CDN).
# Do not add legacy vercel.json "builds": it skips buildCommand. Do not add functions.app.py: that pattern only matches api/*.py.
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

echo "Vercel build OK: bridge/_vercel_public + public/, bridge/protocol_analyzer"
