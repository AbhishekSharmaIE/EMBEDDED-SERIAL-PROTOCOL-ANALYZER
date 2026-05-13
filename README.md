[![CI](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/ci.yml)
[![Pages](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/pages.yml/badge.svg)](https://github.com/AbhishekSharmaIE/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/actions/workflows/pages.yml)

# Embedded Serial Protocol Analyzer

MISRA-aware UART, SPI, and I2C frame simulation in C, a FastAPI bridge, and a React dashboard with an oscilloscope-style timeline.

## Why this project

Hiring managers for embedded and automotive software roles look for protocol literacy, disciplined C, traceability to standards, and the ability to ship a full vertical slice—not only a snippet on a dev board. This repository is a compact demo of that stack: deterministic protocol math in firmware-style C, JSON output for tooling, a small REST API, and a polished UI with a short boot splash and an in-app **About** modal (MISRA, ASPICE, protocol one-liners).

## Screenshots

| Asset | Notes |
| --- | --- |
| [docs/demo.gif](docs/demo.gif) | **Placeholder** (1×1 transparent GIF). Replace with a screen capture after you run the stack. |

**Recording a real demo GIF**

1. Start the bridge (`python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000` in `bridge/`) and the dashboard (`npm run dev` in `dashboard/`), or use `docker compose up --build`.
2. Use **[LICEcap](https://www.cockos.com/licecap/)** (Windows/macOS) or **[Kap](https://getkap.co/)** (macOS) to capture a ~10–20 s window: show UART/SPI/I2C tabs, submit a frame, and pan the timeline if applicable.
3. Export as GIF, overwrite `docs/demo.gif`, and commit (keep file size reasonable; trim borders and resolution in the recorder if needed).

## Architecture

```
┌─────────────────┐     JSON (stdout)      ┌──────────────────┐     REST JSON     ┌────────────────────┐
│  firmware/ (C)  │ ─────────────────────► │  bridge/ (Python)│ ────────────────► │ dashboard/ (React)│
│  uart / spi /   │   subprocess per       │  FastAPI +        │   /api/* +        │  Vite, Recharts,    │
│  i2c simulators │   request              │  uvicorn          │   /health       │  Tailwind UI        │
└─────────────────┘                        └──────────────────┘                   └────────────────────┘
```

The C binary is the single source of truth for bit-level framing; the bridge parses one JSON line per invocation; the dashboard visualizes bits, edges, and MISRA-oriented notes.

## Skills demonstrated

- **Embedded C**: UART/SPI/I2C framing, explicit types, MISRA-oriented style; Doxygen-style comments on public and static helpers.
- **Integration**: Subprocess bridge, error handling, Docker Compose for reproducible runs.
- **Web**: TypeScript, React, API client with safe error-body handling, Vite dev proxy to the API.
- **Quality**: Unit tests for the firmware logic, GitHub Actions CI, ASPICE/MISRA documentation under `docs/`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Protocol engine | C99, GCC, Make |
| Bridge API | Python 3, FastAPI, Uvicorn |
| Dashboard | React, TypeScript, Vite, Tailwind CSS |
| CI | GitHub Actions |
| Containers | Docker Compose (build + API + static UI) |

## How to run

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

## GitHub Pages (hosted dashboard)

The workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) builds the dashboard with the correct [Vite `base`](https://vite.dev/config/shared-options.html#base) for a **project site** and deploys the `dist/` folder to GitHub Pages on every push to `main`.

1. In the GitHub repo: **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main` (or run the **Pages** workflow manually). When it finishes, open  
   `https://<your-username>.github.io/<repository-name>/`  
   (for this fork: `https://abhisheksharmaie.github.io/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/` — GitHub may normalize hostname casing).

**API from the hosted UI:** GitHub Pages only serves static files. The bridge still runs on your machine, Docker, or another host. To point the Pages build at a **public HTTPS** API:

- Add a repository **variable** named `PUBLIC_BRIDGE_URL` (for example `https://your-api.example.com`) with no trailing slash. The workflow passes it as `VITE_API_URL` at build time.
- On the bridge, set **`CORS_EXTRA_ORIGINS`** to the Pages origin (for project sites the browser `Origin` is typically `https://<username>.github.io`). Example:  
  `CORS_EXTRA_ORIGINS=https://abhisheksharmaie.github.io`  
  (comma-separated if you need more than one).

Without `PUBLIC_BRIDGE_URL`, production builds keep calling `http://localhost:8000`, which is appropriate for Docker or local static preview, not for visitors on `github.io`.

## Further documentation

- [docs/README.md](docs/README.md) — index of MISRA and ASPICE notes.
- [EMBEDDED_PROTOCOL_ANALYZER.md](EMBEDDED_PROTOCOL_ANALYZER.md) — deeper design narrative (if present in your checkout).
