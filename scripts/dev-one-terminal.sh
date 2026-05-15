#!/usr/bin/env bash
# Run FastAPI (background) + Vite (foreground) in one shell — one terminal for local dev.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-8000}"

bash scripts/run-local-api.sh &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait until the API answers (Vite proxy will fail with ECONNREFUSED if we start too early).
for _ in $(seq 1 60); do
  if curl -sf "http://${HOST}:${PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

cd "${ROOT}/dashboard"
if [[ ! -d node_modules ]]; then
  npm ci
fi
exec npm run dev
