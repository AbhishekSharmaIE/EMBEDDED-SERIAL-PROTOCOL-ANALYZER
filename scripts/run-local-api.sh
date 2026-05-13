#!/usr/bin/env bash
# Run FastAPI from the repository root (required for `import bridge.api`).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck source=/dev/null
. .venv/bin/activate
pip install -q -r requirements.txt

if [[ ! -x firmware/bin/protocol_analyzer ]]; then
  echo "Building firmware (need gcc + make)…" >&2
  make -C firmware all
fi

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"
exec python -m uvicorn app:app --host "$HOST" --port "$PORT" --reload "$@"
