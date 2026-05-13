# Embedded Serial Protocol Analyzer

Deterministic **UART**, **SPI**, and **I2C** frame simulation in **C**, a small **FastAPI** bridge, and a **React** dashboard with oscilloscope-style timelines, byte breakdown, and MISRA-oriented notes in the UI.

---

## Screenshots

### UART — start, data, parity, stop

![UART frame analysis: visualization timeline, byte breakdown 0xA5, MISRA notes](docs/images/readme-uart.png)

### SPI — clock, MOSI, CS, edge timing

![SPI frame analysis: CLK/MOSI/CS traces, payload 0x3C, mode and frequency controls](docs/images/readme-spi.png)

### I2C — START, address, R/W, ACK, data, STOP

![I2C transaction: bus visualization, wire address byte breakdown, payload bytes](docs/images/readme-i2c.png)

---

## Architecture

End-to-end view of how configuration flows from the browser to C simulators and how structured JSON returns for charts and tables.

```mermaid
flowchart TB
  subgraph OperatorLayer["Operator"]
    OP[Browser]
  end

  subgraph PresentationLayer["Presentation — dashboard"]
    direction TB
    VITE[Vite dev or static dist]
    REACT[React 18 TypeScript]
    APP[App layout tabs UART SPI I2C]
    SEL[ProtocolSelector and forms]
    TL[FrameTimeline Recharts]
    BB[ByteBreakdown radix grid]
    ABOUT[About MISRA ASPICE copy]
    CLIENT[api client HTTP helpers]
    PROXY[Vite dev proxy pa api health to 8000]
    VITE --> REACT --> APP
    APP --> SEL
    APP --> TL
    APP --> BB
    APP --> ABOUT
    SEL --> CLIENT
    TL --> CLIENT
    CLIENT --> PROXY
  end

  subgraph ApplicationLayer["Application — Python bridge"]
    direction TB
    ENTRY[Root app.py and api.py load bridge.api]
    ASGI[FastAPI app]
    MW[CORS allow all origins]
    H[GET health]
    LIST[GET protocols on pa and api paths]
    UART[POST uart on pa and api paths]
    SPI[POST spi on pa and api paths]
    I2C[POST i2c on pa and api paths]
    PYD[Pydantic request bodies]
    RUN[Subprocess argv plus capture stdout stderr]
    ERR[Map failures to HTTP errors]
    SPA[Optional FileResponse and StaticFiles for dist]
    ENTRY --> ASGI --> MW
    MW --> H
    MW --> LIST
    MW --> UART
    MW --> SPI
    MW --> I2C
    UART --> PYD
    SPI --> PYD
    I2C --> PYD
    PYD --> RUN
    RUN --> ERR
    ASGI --> SPA
  end

  subgraph DomainLayer["Domain — firmware ELF"]
    direction TB
    MK[Make links uart spi i2c sources]
    ELF[protocol_analyzer binary]
    CLI[Per protocol argv entry]
    CUART[UART framing]
    CSPI[SPI framing]
    CI2C[I2C framing]
    JSONL[Single line JSON on stdout]
    MK --> ELF
    ELF --> CLI
    CUART --> CLI
    CSPI --> CLI
    CI2C --> CLI
    CLI --> JSONL
  end

  subgraph ComposeLayer["Optional Docker Compose"]
    DC[docker compose up]
    GCB[firmware-builder gcc make]
    VOL[Volume firmware bin]
    BRIMG[bridge image uvicorn]
    DASHIMG[dashboard on 5173]
    DC --> GCB --> VOL
    DC --> BRIMG
    DC --> DASHIMG
    BRIMG --> VOL
  end

  OP --> VITE
  PROXY --> ASGI
  RUN --> ELF
  ELF --> JSONL
  JSONL --> PARSE[json loads first stdout line]
  PARSE -->|HTTP JSON| PROXY
  BRIMG -.->|runs same FastAPI app| ASGI
```

**Reading the diagram**

- **Presentation**: the dashboard collects per-protocol parameters, calls the shared HTTP client, and renders timelines plus byte grids from the returned JSON.
- **Application**: FastAPI validates requests, maps them to **argv** for the firmware CLI, runs one subprocess per analyze action, and turns firmware output into HTTP JSON or clear error payloads.
- **Domain**: the ELF implements UART, SPI, and I2C framing with explicit timing and bit order; it always prints a **single-line JSON** result for the bridge to parse.
- **Data flow**: each analyze click is one round trip: **JSON in → argv → subprocess → JSON line out → REST JSON in** for the charts.

---

## Tech stack

| Layer | Role | Technologies |
| --- | --- | --- |
| Firmware | Bit-accurate framing and timing | C99, GCC, Make |
| Bridge | REST, validation, process I/O | Python 3, FastAPI, Pydantic, Uvicorn |
| Dashboard | UI, charts, forms | React, TypeScript, Vite, Tailwind, Recharts |

---

## Run locally

**Two processes**: API on **port 8000**, dashboard on **5173** (Vite proxies `/pa`, `/api`, and `/health` to the API).

**1 — API (repository root)**

```bash
bash scripts/run-local-api.sh
```

Or: `python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && make -C firmware all && python app.py`  
You can also use `python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000` or `python -m uvicorn api:app --reload --host 127.0.0.1 --port 8000` from the **repo root** (both entry modules re-export the same app).

**2 — Dashboard**

```bash
cd dashboard
npm ci
npm run dev
```

Open **http://localhost:5173**. Start the API **before** the dashboard if you rely on the dev proxy.

**Docker (single command from repo root)**

```bash
docker compose up --build
```

Then open **http://localhost:5173** for the UI and **http://localhost:8000** for the API.
