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
│  uart / spi /   │   subprocess per       │  FastAPI +        │   /pa/* +         │  Vite, Recharts,    │
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

Open the URL shown in the terminal (typically `http://localhost:5173`). With `npm run dev`, `/pa` and `/health` are proxied to `http://127.0.0.1:8000`, so start the bridge there (or set `VITE_API_URL` at build time for other setups).

## GitHub Pages (hosted dashboard)

The workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) builds the dashboard with the correct [Vite `base`](https://vite.dev/config/shared-options.html#base) for a **project site**, then pushes `dashboard/dist` to the **`gh-pages`** branch. GitHub Pages serves that branch as the site (no “GitHub Actions” Pages source required).

### One-time setup

1. **Settings → Actions → General → Workflow permissions** → choose **Read and write permissions** and save.  
   If workflows are read-only, the push to `gh-pages` fails because `GITHUB_TOKEN` cannot write branches.
2. **Settings → Pages → Build and deployment** → **Source: Deploy from a branch** → Branch **`gh-pages`**, folder **`/` (root)** → Save.  
   The first workflow run creates `gh-pages`; if Pages still shows “None”, run **Actions → Pages → Re-run all jobs** after the branch exists.

Site URL:

`https://<your-username>.github.io/<repository-name>/`

(for this repo, typically `https://abhisheksharmaie.github.io/EMBEDDED-SERIAL-PROTOCOL-ANALYZER/` — GitHub may normalize hostname casing).

**API from the hosted UI:** GitHub Pages only serves static files. The bridge still runs on your machine, Docker, or another host. To point the Pages build at a **public HTTPS** API:

- Add a repository **variable** named `PUBLIC_BRIDGE_URL` (for example `https://your-api.example.com`) with no trailing slash. The workflow passes it as `VITE_API_URL` at build time.
- On the bridge, set **`CORS_EXTRA_ORIGINS`** to the Pages origin (for project sites the browser `Origin` is typically `https://<username>.github.io`). Example:  
  `CORS_EXTRA_ORIGINS=https://abhisheksharmaie.github.io`  
  (comma-separated if you need more than one).

Without `PUBLIC_BRIDGE_URL`, production builds keep calling `http://localhost:8000`, which is appropriate for Docker or local static preview, not for visitors on `github.io`.

## Vercel (full stack: FastAPI + firmware binary + static UI)

The repo is configured for a **single Vercel project** at the repository root:

- **[`vercel.json`](vercel.json)** — `installCommand` is a **POSIX `sh -c` one-liner** (`uv pip install --system` or `pip install --break-system-packages`), then **`npm ci`** in `dashboard/`. **`buildCommand`** runs [`scripts/vercel-build.sh`](scripts/vercel-build.sh) (firmware ELF + dashboard build with `VITE_API_URL=relative`). The UI is written to **`public/`** (required **`outputDirectory`** for this project) and duplicated under **`bridge/_vercel_public/`** so FastAPI can serve **`/`** and **`/assets`** from the Python bundle. [`scripts/vercel-install.sh`](scripts/vercel-install.sh) mirrors install logic for local checks.
- **[`pyproject.toml`](pyproject.toml)** — `[tool.vercel] entrypoint = "bridge.api:app"` so Vercel runs the FastAPI app as one function (same routes as local uvicorn: `/health`, `/pa/...`).
- **[`deploy/vercel/protocol_analyzer_linux_amd64`](deploy/vercel/protocol_analyzer_linux_amd64)** — prebuilt **Linux x86-64** firmware CLI used when the Vercel builder has no `gcc` (see [`deploy/vercel/README.txt`](deploy/vercel/README.txt) to refresh after C changes).

### Deploy steps

1. Import the GitHub repo in [Vercel](https://vercel.com/new) and deploy with defaults: **Root Directory** = repository root (`.`). Do **not** set the root to `dashboard/` only, or `vercel.json` and the Python app will not apply.
2. **Output Directory** should match the repo: **`public`** (set in [`vercel.json`](vercel.json) as `outputDirectory`). If the Vercel dashboard overrides it to something else (or leaves an old value), the build can fail with “No Output Directory named public found”.
3. **Install Command must not be overridden in the dashboard.** In **Project → Settings → Build & Development**, clear **Install Command** (leave empty so **`vercel.json`** is used). If the build log still shows `pip install -r requirements.txt && cd dashboard && npm ci`, you are either on an **old commit** (before `b71c279`) or a **saved override** is ignoring the repo.
4. Redeploy **latest `main`**. The install step should show the `uv pip install --system` / `sh -c '...'` line from `vercel.json`, not plain `pip install -r requirements.txt`.
5. Optional environment variables in the Vercel project:
   - **`CORS_EXTRA_ORIGINS`** — add your production URL(s), comma-separated (e.g. `https://your-app.vercel.app`). Preview deployments use `https://*.vercel.app`; when **`VERCEL=1`** (set in `vercel.json`), the bridge also allows that pattern via **`allow_origin_regex`**.
   - **`CORS_ORIGIN_REGEX`** — override the preview regex if needed.
6. After changing firmware C code, rebuild the prebuilt binary on Linux and commit (see `deploy/vercel/README.txt`).

The dashboard calls **`/pa/*` and `/health` on the same origin** (`VITE_API_URL=relative` at build time), so the live UI and bridge stay on one deployment. (Paths are **`/pa/*`**, not **`/api/*`**: on Vercel, **`/api/*`** is reserved for the file-based `api/` serverless layout and will not reach a monolithic FastAPI app in `bridge/`.)

**“NOT_FOUND” / “The page could not be found”** in the UI after **Analyze** usually means **POST `/pa/*` got a CDN 404** (response body is shown in the red error box). Typical causes: **Install Command** override, wrong **Root Directory**, or a project preset that never deploys the Python function. The build keeps both **`public/`** (Vercel output) and **`bridge/_vercel_public/`** (FastAPI bundle) so **`/`, `/assets/*`, `/pa/*`, and `/health`** can be served correctly.

## Further documentation

- [docs/README.md](docs/README.md) — index of MISRA and ASPICE notes.
- [EMBEDDED_PROTOCOL_ANALYZER.md](EMBEDDED_PROTOCOL_ANALYZER.md) — deeper design narrative (if present in your checkout).
