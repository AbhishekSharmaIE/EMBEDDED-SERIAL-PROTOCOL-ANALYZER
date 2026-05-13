#!/usr/bin/env bash
# Vercel: Python is PEP 668 / uv-managed — plain `pip install` fails. Prefer uv; fall back to pip.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if command -v uv >/dev/null 2>&1; then
  uv pip install --system -r requirements.txt
else
  pip install --break-system-packages -r requirements.txt
fi

cd dashboard
npm ci
