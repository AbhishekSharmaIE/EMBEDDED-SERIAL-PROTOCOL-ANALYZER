"""Vercel ASGI entry: default discovery looks for `app` in `app.py` at the repo root."""

from bridge.api import app

__all__ = ["app"]
