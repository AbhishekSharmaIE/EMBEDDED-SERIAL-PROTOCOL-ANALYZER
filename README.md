[![CI](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/ci.yml)

# Embedded Serial Protocol Analyzer

MISRA-aware UART/SPI/I2C simulator with React visualization dashboard.

## Overview

This project provides a cross-platform stack for simulating serial protocols in embedded-style C, exposing results through a Python API, and visualizing frames in a React dashboard. Documentation will map design choices to automotive software quality practices (MISRA C awareness, ASPICE-oriented traceability).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Protocol engine | C99, GCC, Make |
| Bridge API | Python 3, FastAPI, Uvicorn |
| Dashboard | React, TypeScript, Vite |
| CI | GitHub Actions |
| Containers | Docker Compose (firmware build + API + static UI) |

## How to Run

### With Docker (one command)

```bash
git clone https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER.git
cd EMBEDDED-SERIAL-PROTOCOL-ANALYZER
docker compose up --build
```

Open **http://localhost:5173** (static dashboard) while the API serves on **http://localhost:8000**.

Use `docker compose` (Docker CLI v2). If you only have the older standalone binary, use `docker-compose up --build`.

### Run locally (without Docker)

#### Firmware (C)

```bash
cd firmware
make all
./bin/protocol_analyzer
```

#### Bridge (API)

```bash
cd bridge
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

If `uvicorn` is not on your `PATH` inside the venv, `python -m uvicorn` (as above) is the reliable form.

#### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`). With `npm run dev`, `/api` and `/health` are proxied to `http://127.0.0.1:8000`, so start the bridge there (or set `VITE_API_URL` at build time for other setups).

## Architecture

```
firmware/ (C)  →  bridge/ (FastAPI)  →  dashboard/ (React + Vite)
     │                    │                      │
  simulate /         REST JSON              visualization
  decode frames      + subprocess C           + UX
```

The C layer produces protocol data; the bridge wraps it for the web UI; the dashboard consumes the API and renders timelines and breakdowns.
