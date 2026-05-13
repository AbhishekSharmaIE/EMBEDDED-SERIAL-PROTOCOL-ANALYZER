"""Vercel ASGI entry: default discovery looks for `app` in `app.py` at the repo root."""

from __future__ import annotations

import os

from bridge.api import app

__all__ = ["app"]


def main() -> None:
    import uvicorn

    uvicorn.run(
        "app:app",
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "8000")),
        reload=os.environ.get("UVICORN_RELOAD", "1").lower() in ("1", "true", "yes"),
    )


if __name__ == "__main__":
    main()
