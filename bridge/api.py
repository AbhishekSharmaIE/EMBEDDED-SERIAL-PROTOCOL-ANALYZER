"""FastAPI bridge: exposes REST wrappers around the C firmware CLI."""

from __future__ import annotations

import json
import logging
import os
import subprocess
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


def _path_from_env(name: str, default: Path) -> Path:
    raw = os.environ.get(name)
    if raw:
        return Path(raw).expanduser().resolve()
    return default


_here = Path(__file__).resolve()
_default_root = _here.parent.parent
ROOT = _path_from_env("APP_ROOT", _default_root)
FW_DIR = _path_from_env("FW_DIR", ROOT / "firmware")
# Vercel: vercel-build.sh copies the ELF next to api.py so it stays in the bridge/ package tree.
_bundled_cli = _here / "protocol_analyzer"
_default_binary = _bundled_cli if _bundled_cli.is_file() else (FW_DIR / "bin" / "protocol_analyzer")
BINARY = _path_from_env("PROTOCOL_ANALYZER", _default_binary)

# Primary REST prefix for Vercel and docs: `/pa/*` (avoids collision with Vercel's file-based `/api/*.py` layout).
# `/api/*` aliases are registered on the same FastAPI app for local tools and older clients.
_PA = "/pa"
_API = "/api"

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Embedded Serial Protocol Analyzer",
    description="Bridge between C firmware and the React dashboard.",
    version="0.2.0",
)

# Broad CORS: avoids Starlette `allow_origin_regex` edge cases on some serverless stacks; credentials stay off.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _run_firmware(args: list[str]) -> dict[str, Any]:
    if not BINARY.is_file():
        raise HTTPException(status_code=500, detail="firmware binary missing; build failed?")

    try:
        proc = subprocess.run(
            [str(BINARY), *args],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=5,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(status_code=500, detail="firmware subprocess timed out") from exc
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"could not run firmware binary ({BINARY}): {exc}",
        ) from exc

    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "firmware process failed").strip() or f"exit code {proc.returncode}"
        raise HTTPException(status_code=500, detail=detail)

    raw = (proc.stdout or "").strip()
    if not raw:
        err = (proc.stderr or "").strip()
        raise HTTPException(status_code=500, detail=f"empty stdout from firmware; stderr={err!r}")

    line = raw.splitlines()[0].strip()
    try:
        return json.loads(line)
    except json.JSONDecodeError as exc:
        err = (proc.stderr or "").strip()
        raise HTTPException(
            status_code=500,
            detail=(
                f"invalid JSON from firmware: {exc}; "
                f"stdout(first 400)={line[:400]!r}; stderr(first 400)={err[:400]!r}"
            ),
        ) from exc


class UartFrameRequest(BaseModel):
    data: int = Field(..., ge=0, le=255)
    parity: Literal["none", "even", "odd"]
    stop_bits: Literal[1, 2]


class SpiFrameRequest(BaseModel):
    data: int = Field(..., ge=0, le=255)
    mode: int = Field(..., ge=0, le=3)
    bit_order: Literal["msb", "lsb"]
    freq_hz: int = Field(..., ge=1, le=100_000_000)


class I2cFrameRequest(BaseModel):
    address: int = Field(..., ge=0, le=127)
    rw: Literal["read", "write"]
    data: list[int] = Field(default_factory=list)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _protocols() -> list[dict[str, str]]:
    return [
        {
            "id": "uart",
            "name": "UART",
            "description": "Async serial: start bit, 8 data bits, optional parity, stop bit(s).",
        },
        {
            "id": "spi",
            "name": "SPI",
            "description": "Synchronous serial: CPOL/CPHA modes, MSB/LSB, clocked MOSI/MISO.",
        },
        {
            "id": "i2c",
            "name": "I2C",
            "description": "Two-wire: START, 7-bit address, R/W, ACK, data bytes, STOP.",
        },
    ]


@app.get(f"{_PA}/protocols")
def list_protocols() -> list[dict[str, str]]:
    return _protocols()


@app.get(f"{_API}/protocols")
def list_protocols_api_alias() -> list[dict[str, str]]:
    return _protocols()


def _uart_analyze(body: UartFrameRequest) -> dict[str, Any]:
    args = ["uart", str(body.data), body.parity, str(body.stop_bits)]
    return _run_firmware(args)


@app.post(f"{_PA}/uart/frame")
def uart_frame(body: UartFrameRequest) -> dict[str, Any]:
    return _uart_analyze(body)


@app.post(f"{_API}/uart/frame")
def uart_frame_api_alias(body: UartFrameRequest) -> dict[str, Any]:
    return _uart_analyze(body)


def _spi_analyze(body: SpiFrameRequest) -> dict[str, Any]:
    args = ["spi", str(body.data), str(body.mode), body.bit_order, str(body.freq_hz)]
    return _run_firmware(args)


@app.post(f"{_PA}/spi/frame")
def spi_frame(body: SpiFrameRequest) -> dict[str, Any]:
    return _spi_analyze(body)


@app.post(f"{_API}/spi/frame")
def spi_frame_api_alias(body: SpiFrameRequest) -> dict[str, Any]:
    return _spi_analyze(body)


def _i2c_analyze(body: I2cFrameRequest) -> dict[str, Any]:
    if len(body.data) > 32:
        raise HTTPException(status_code=400, detail="at most 32 data bytes")

    for b in body.data:
        if b < 0 or b > 255:
            raise HTTPException(status_code=400, detail="each data byte must be 0-255")

    args = ["i2c", str(body.address), body.rw]
    if len(body.data) > 0:
        args.append(",".join(str(int(x)) for x in body.data))

    return _run_firmware(args)


@app.post(f"{_PA}/i2c/frame")
def i2c_frame(body: I2cFrameRequest) -> dict[str, Any]:
    return _i2c_analyze(body)


@app.post(f"{_API}/i2c/frame")
def i2c_frame_api_alias(body: I2cFrameRequest) -> dict[str, Any]:
    return _i2c_analyze(body)


def _register_spa_static() -> None:
    """Serve the Vite dist from bridge/_vercel_public or root public/. Registers GET / always."""
    candidates = (
        _here / "_vercel_public",
        ROOT / "public",
        Path.cwd() / "bridge" / "_vercel_public",
        Path.cwd() / "public",
    )
    spa: Path | None = None
    for base in candidates:
        try:
            r = base.resolve()
        except OSError:
            continue
        if (r / "index.html").is_file():
            spa = r
            break

    if spa is None:
        logger.error("No index.html under bridge/_vercel_public or public/ (run scripts/vercel-build.sh).")

        @app.get("/", include_in_schema=False)
        def spa_missing() -> HTMLResponse:
            return HTMLResponse(
                "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"/><title>Serial Protocol Analyzer</title>"
                "<body><h1>Serial Protocol Analyzer</h1><p>UI bundle missing.</p>"
                "<p><a href=\"/health\">/health</a> · <a href=\"/pa/protocols\">/pa/protocols</a></p></body></html>",
                status_code=503,
            )
        return

    index = spa / "index.html"
    assets = spa / "assets"

    @app.get("/", include_in_schema=False)
    def spa_index() -> FileResponse:
        return FileResponse(index, media_type="text/html")

    @app.get("/404.html", include_in_schema=False)
    def spa_404() -> FileResponse:
        p404 = spa / "404.html"
        if p404.is_file():
            return FileResponse(p404, media_type="text/html")
        return FileResponse(index, media_type="text/html")

    if assets.is_dir():
        try:
            app.mount("/assets", StaticFiles(directory=str(assets)), name="spa_assets")
        except Exception:
            logger.exception("Mount /assets failed (check SPA files in serverless bundle).")


_register_spa_static()
