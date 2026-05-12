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

## How to Run

### Firmware (C)

```bash
cd firmware
make all
./bin/protocol_analyzer
```

### Bridge (API)

```bash
cd bridge
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Docker (later)

Docker Compose will be added in a follow-up step for one-command startup.

## Architecture

```
firmware/ (C)  →  bridge/ (FastAPI)  →  dashboard/ (React + Vite)
     │                    │                      │
  simulate /         REST JSON              visualization
  decode frames      + subprocess C           + UX
```

The C layer produces protocol data; the bridge wraps it for the web UI; the dashboard consumes the API and renders timelines and breakdowns.
