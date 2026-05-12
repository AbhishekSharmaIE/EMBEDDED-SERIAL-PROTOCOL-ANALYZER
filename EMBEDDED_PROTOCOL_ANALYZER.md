# 🔬 Embedded Serial Protocol Analyzer
### A MISRA-aware, ASPICE-aligned embedded C + React dashboard project

> **Recruiter Signal:** Demonstrates UART/SPI/I2C protocol knowledge, MISRA C compliance awareness, safety-critical coding practices, and a modern visualization dashboard — all in one repo.

---

## 📌 Project Overview

A cross-platform tool that:
- **Simulates** UART, SPI, and I2C protocol frames in C (embedded-style, MISRA-aware)
- **Decodes** raw byte streams into human-readable packets
- **Visualizes** protocol timings and frame breakdowns on a React dashboard
- **Documents** every design decision against ASPICE SWE.3/SWE.4 standards

This is the kind of project a Valeo/Aptiv/Continental embedded grad engineer would be expected to understand — and you're building it from scratch.

---

## 🗂️ Repo Structure

```
embedded-protocol-analyzer/
├── firmware/                   # Pure C, MISRA-aware protocol simulation
│   ├── src/
│   │   ├── uart_sim.c
│   │   ├── spi_sim.c
│   │   ├── i2c_sim.c
│   │   ├── frame_decoder.c
│   │   └── main.c
│   ├── include/
│   │   ├── uart_sim.h
│   │   ├── spi_sim.h
│   │   ├── i2c_sim.h
│   │   └── frame_decoder.h
│   ├── tests/
│   │   └── test_frames.c
│   └── Makefile
├── bridge/                     # Python bridge: runs C binary, exposes REST API
│   ├── api.py
│   └── requirements.txt
├── dashboard/                  # React + Recharts visualization dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ProtocolSelector.tsx
│   │   │   ├── FrameTimeline.tsx
│   │   │   ├── ByteBreakdown.tsx
│   │   │   └── MisraPanel.tsx
│   │   └── api/
│   │       └── client.ts
│   └── package.json
├── docs/
│   ├── ASPICE_TRACEABILITY.md
│   ├── MISRA_COMPLIANCE_NOTES.md
│   └── architecture.png
├── .github/
│   └── workflows/
│       └── ci.yml              # Build + test on every push
├── docker-compose.yml
└── README.md
```

---

## ⚡ Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Protocol Engine | C99, GCC | Embedded-realistic, MISRA-applicable |
| Bridge API | Python + FastAPI | Lightweight, easy to extend |
| Dashboard | React + TypeScript + Recharts | Recruiter-visible, interactive |
| CI/CD | GitHub Actions | Shows DevOps awareness |
| Containerization | Docker Compose | One-command startup |

---

## 🎯 MISRA & ASPICE Awareness (Your Differentiator)

Every C file includes a header comment block citing the MISRA C:2012 rules being followed:

```c
/**
 * @file uart_sim.c
 * @brief UART frame simulator — MISRA C:2012 compliant subset
 *
 * MISRA Rules Applied:
 *   Rule 15.5  — Single point of exit per function
 *   Rule 17.7  — Return value of non-void functions always used
 *   Rule 21.6  — No stdio.h in production paths (test builds only)
 *   Rule 14.4  — Boolean expressions only in if/while conditions
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
```

---

---
---

# 🤖 CURSOR AI PROMPTS
## Copy-paste these in order. One prompt per session/feature.

---

## PROMPT 0 — Repo Bootstrap

```
Create a new project called `embedded-protocol-analyzer`.

Set up this exact folder structure:
- firmware/src/ — for C source files
- firmware/include/ — for C headers
- firmware/tests/ — for C unit tests
- firmware/Makefile
- bridge/ — Python FastAPI app
- dashboard/ — React TypeScript app (use Vite)
- docs/ — markdown documentation
- .github/workflows/ci.yml

Initialize a git repo. Create a .gitignore for C (obj, bin), Python (__pycache__, .env), and Node (node_modules, dist).

Create an initial README.md with:
- Project title: "Embedded Serial Protocol Analyzer"
- One-line description: "MISRA-aware UART/SPI/I2C simulator with React visualization dashboard"
- Sections: Overview, Tech Stack, How to Run, Architecture

Commit everything with message: "chore: initial project scaffold"
Push to GitHub.
```

---

## PROMPT 1 — UART Simulator in C

```
In firmware/src/uart_sim.c and firmware/include/uart_sim.h, implement a UART frame simulator in C99.

Requirements:
- Model a UART frame: start bit, 8 data bits, optional parity bit, stop bit(s)
- Function: `uart_frame_t uart_build_frame(uint8_t data, uart_config_t config)`
- Function: `int uart_validate_frame(uart_frame_t frame)` — returns 0 on valid, error code otherwise
- Function: `void uart_print_frame(uart_frame_t frame)` — prints bit-by-bit breakdown to stdout
- Define enums for parity: UART_PARITY_NONE, UART_PARITY_EVEN, UART_PARITY_ODD
- Define enum for stop bits: UART_STOP_1, UART_STOP_2

MISRA C:2012 compliance notes (add as comments in the file):
- Rule 15.5: single return point per function
- Rule 17.7: always use return values
- Rule 14.4: only boolean expressions in conditionals
- Rule 21.6: no stdio in production path (wrap printf in #ifdef DEBUG)

Add a file header comment block citing: file purpose, MISRA rules applied, ASPICE reference SWE.3.

In firmware/tests/test_frames.c, write 5 unit tests using assert():
1. Valid frame with no parity passes validation
2. Valid frame with even parity passes
3. Corrupted parity bit fails validation
4. Frame with 2 stop bits builds correctly
5. All 256 possible byte values produce valid frames

Update Makefile to compile uart_sim.c and run tests.

Commit: "feat(firmware): UART frame simulator with MISRA compliance notes"
Push.
```

---

## PROMPT 2 — SPI Simulator in C

```
In firmware/src/spi_sim.c and firmware/include/spi_sim.h, implement an SPI frame simulator in C99.

Requirements:
- Model SPI modes: CPOL/CPHA combinations (Mode 0, 1, 2, 3)
- Struct: `spi_frame_t` with fields: mode, cs_active_low, bit_order (MSB/LSB first), data (uint8_t), clock_edges (array of 16 timestamps in microseconds)
- Function: `spi_frame_t spi_build_frame(uint8_t data, spi_config_t config)`
- Function: `void spi_simulate_clock_edges(spi_frame_t *frame, uint32_t freq_hz)` — fills clock_edges array with simulated timestamps based on frequency
- Function: `void spi_print_frame(spi_frame_t frame)` — shows MOSI/MISO/CLK/CS signal breakdown

MISRA compliance header identical in structure to uart_sim.c.
Add Rule 18.1: pointer arithmetic kept within array bounds.

Write 4 unit tests in firmware/tests/test_frames.c (append to existing file):
1. Mode 0 frame builds correctly
2. LSB-first vs MSB-first produce bit-reversed data bytes
3. Clock edges array length equals 2 * data bits
4. 1MHz and 10MHz frequencies produce proportionally spaced timestamps

Commit: "feat(firmware): SPI frame simulator with clock edge simulation"
Push.
```

---

## PROMPT 3 — I2C Simulator in C

```
In firmware/src/i2c_sim.c and firmware/include/i2c_sim.h, implement an I2C frame simulator in C99.

Requirements:
- Model a complete I2C transaction: START condition, 7-bit address, R/W bit, ACK/NACK, data bytes, STOP condition
- Struct: `i2c_frame_t` with: address (7-bit), rw_bit, ack_received (bool), data (uint8_t array, max 32 bytes), data_len, error_code
- Function: `i2c_frame_t i2c_build_frame(uint8_t addr, uint8_t rw, uint8_t *data, uint8_t len)`
- Function: `int i2c_validate_address(uint8_t addr)` — reject reserved addresses (0x00-0x07, 0x78-0x7F)
- Function: `void i2c_print_frame(i2c_frame_t frame)` — show START/ADDR/RW/ACK/DATA/STOP breakdown

MISRA compliance header. Add:
- Rule 1.3: no undefined behaviour (bounds check all array accesses)
- Rule 17.3: no implicit function declarations

Write 5 unit tests:
1. Valid address + write + 1 data byte builds correctly
2. Reserved address (0x00) fails validation
3. Read vs write frames differ only in rw_bit
4. Multi-byte payload (10 bytes) stored correctly
5. Address 0x77 (last valid) passes; 0x78 fails

Commit: "feat(firmware): I2C frame simulator with address validation"
Push.
```

---

## PROMPT 4 — Python FastAPI Bridge

```
In bridge/api.py, create a FastAPI app that:

1. Compiles and runs the C firmware binary on startup (subprocess call to `make` in firmware/)
2. Exposes these REST endpoints:

   POST /api/uart/frame
   Body: { "data": 0xA5, "parity": "even", "stop_bits": 1 }
   Returns: full frame breakdown as JSON (bits array, parity_bit, valid: bool)

   POST /api/spi/frame  
   Body: { "data": 0x3C, "mode": 0, "bit_order": "msb", "freq_hz": 1000000 }
   Returns: frame JSON with clock_edges array

   POST /api/i2c/frame
   Body: { "address": 0x48, "rw": "write", "data": [0x01, 0xFF] }
   Returns: full transaction breakdown JSON

   GET /api/protocols
   Returns list of supported protocols with descriptions

3. The C binary writes JSON to stdout — parse that JSON in Python and return it
4. Add CORS middleware to allow React on localhost:5173
5. Error handling: if C binary crashes, return 500 with stderr message

In bridge/requirements.txt: fastapi, uvicorn, pydantic

Run with: uvicorn api:app --reload --port 8000

Commit: "feat(bridge): FastAPI bridge connecting C firmware to REST API"
Push.
```

---

## PROMPT 5 — React Dashboard (THE RECRUITER WOW MOMENT)

```
In dashboard/src/, build a stunning React TypeScript dashboard. This must be visually impressive — like something a senior frontend engineer at a fintech or automotive startup would build.

Design direction: Dark theme, oscilloscope/terminal aesthetic. Think: dark background (#0a0f1e), electric cyan/green accents (#00ff88, #00d4ff), monospace fonts for data, clean sans-serif for labels. Like a digital oscilloscope crossed with a Bloomberg terminal.

Components to build:

1. App.tsx — main layout
   - Left sidebar: protocol selector (UART / SPI / I2C tabs with icons)
   - Main area: split into top (controls) and bottom (visualization)
   - Header: "Serial Protocol Analyzer" with animated blinking cursor

2. ProtocolSelector.tsx
   - Three protocol tabs: UART, SPI, I2C
   - Each tab has a dynamic config form:
     UART: data byte (hex input), parity dropdown, stop bits toggle
     SPI: data byte, mode selector (0-3), bit order toggle, frequency slider (100kHz-10MHz)
     I2C: address (hex), R/W toggle, data bytes (add/remove dynamic list)
   - "Analyze Frame" button triggers API call

3. FrameTimeline.tsx
   - Uses Recharts to draw the signal timeline
   - UART: shows start bit / 8 data bits / parity / stop as colored rectangles on a horizontal timeline
   - SPI: shows CLK, MOSI, CS as three parallel signal lines (like a logic analyzer)
   - I2C: shows START / ADDR / RW / ACK / DATA / STOP as labeled segments
   - Animate the frame drawing left to right on load (CSS animation, 800ms)

4. ByteBreakdown.tsx
   - Shows the byte in binary, hex, decimal, ASCII simultaneously
   - Each bit is a clickable square that highlights on hover
   - Shows which bits are data vs control

5. MisraPanel.tsx
   - Collapsible panel at the bottom
   - Shows: "MISRA C:2012 Rules Applied in This Simulation"
   - Lists rules with checkboxes (all checked, styled green)
   - ASPICE reference: "SWE.3 Software Detailed Design — Unit Verified"
   - Tooltip on hover for each rule explaining it in plain English

API client in dashboard/src/api/client.ts — typed fetch calls to localhost:8000

Style with Tailwind CSS. Use Lucide React for icons.

Make it mobile-responsive. Add a loading skeleton while API responds.

Commit: "feat(dashboard): oscilloscope-aesthetic protocol visualization dashboard"
Push.
```

---

## PROMPT 6 — CI/CD Pipeline

```
Create .github/workflows/ci.yml with this pipeline:

name: CI

Triggers: push and pull_request on main branch

Jobs:

1. firmware-build:
   - runs-on: ubuntu-latest
   - Install gcc
   - cd firmware && make all
   - Run make test
   - On failure: upload firmware/tests/test_output.txt as artifact

2. bridge-test:
   - runs-on: ubuntu-latest  
   - Python 3.11
   - pip install -r bridge/requirements.txt
   - Run: python -c "from api import app; print('Bridge imports OK')"
   - Run a quick curl test against the health endpoint if possible

3. dashboard-build:
   - runs-on: ubuntu-latest
   - Node 20
   - cd dashboard && npm ci && npm run build
   - Check dist/ folder exists and is non-empty

Add a README badge at the top of README.md:
[![CI](https://github.com/YOUR_USERNAME/embedded-protocol-analyzer/actions/workflows/ci.yml/badge.svg)](...)

Commit: "ci: GitHub Actions pipeline for firmware, bridge, and dashboard"
Push.
```

---

## PROMPT 7 — Docker Compose + One-Command Start

```
Create docker-compose.yml at the project root:

Services:

1. firmware-builder:
   - FROM gcc:12
   - WORKDIR /firmware
   - COPY firmware/ .
   - RUN make all
   - Produces binary at /firmware/bin/protocol_analyzer
   - Mounts the bin/ as a shared volume

2. bridge:
   - FROM python:3.11-slim
   - COPY bridge/ /app
   - pip install -r requirements.txt
   - Mounts the firmware binary volume
   - Exposes port 8000
   - Depends on firmware-builder

3. dashboard:
   - FROM node:20-alpine
   - COPY dashboard/ /app
   - npm ci && npm run build
   - Serve with serve -s dist on port 5173
   - Exposes port 5173

Update README.md "How to Run" section:
```bash
git clone https://github.com/YOUR_USERNAME/embedded-protocol-analyzer
cd embedded-protocol-analyzer
docker-compose up --build
# Open http://localhost:5173
```

Also add a "Run Locally (without Docker)" section.

Commit: "chore: docker-compose for one-command startup"
Push.
```

---

## PROMPT 8 — ASPICE & MISRA Documentation

```
Create these two documents:

docs/MISRA_COMPLIANCE_NOTES.md:
- Title: "MISRA C:2012 Compliance Notes"
- Intro paragraph: what MISRA is, why it matters in automotive software (ISO 26262, functional safety)
- Table with columns: Rule ID | Rule Description | Where Applied | Deviation (if any)
- Include at minimum 10 rules from MISRA C:2012 that are actually followed in this codebase
- Section: "Rules Not Applied and Why" — 3-4 rules that require static analysis tools (explain Polyspace, PC-lint)
- Footer: "This project simulates MISRA compliance awareness; full compliance requires certified static analysis tooling"

docs/ASPICE_TRACEABILITY.md:
- Title: "ASPICE SWE Traceability Matrix"
- Intro: what ASPICE is (Automotive SPICE), why Valeo/tier-1 suppliers care
- Table mapping project artifacts to ASPICE process areas:
  | Artifact | ASPICE Process | Work Product |
  | uart_sim.c | SWE.3 Software Detailed Design | Software Unit |
  | test_frames.c | SWE.4 Software Unit Verification | Test Spec + Results |
  | MISRA_COMPLIANCE_NOTES.md | SWE.3 | Compliance Evidence |
  | ci.yml | SWE.4 | Automated Test Execution |
- Section: "Verification Strategy" — unit tests, CI automation, code review checklist

Commit: "docs: MISRA compliance notes and ASPICE traceability matrix"
Push.
```

---

## PROMPT 9 — Polish & Demo-Ready Final Pass

```
Final polish pass — make this repo recruiter-ready:

1. README.md final version:
   - Add CI badge (from prompt 6)
   - Add a "Screenshots" section with placeholder for dashboard screenshot
   - Add "Why This Project" section explaining the connection to automotive embedded systems, MISRA, and ASPICE
   - Add "Architecture" section with a simple ASCII diagram of: C Firmware → Python Bridge → React Dashboard
   - Add "Skills Demonstrated" section: Embedded C, Protocol Engineering, MISRA Awareness, ASPICE Traceability, REST API, React/TypeScript, Docker, CI/CD

2. Add a demo GIF placeholder in docs/demo.gif with instructions on how to record one using LICEcap or Kap

3. In dashboard, add a "About This Project" modal (triggered by info icon in header) that explains:
   - What UART/SPI/I2C are (one sentence each)
   - What MISRA C is
   - What ASPICE is
   - Why this matters for automotive embedded roles
   
   This means even a non-technical recruiter who opens the dashboard understands why it's impressive.

4. Add a loading animation on the dashboard home screen:
   - Simulates an oscilloscope "scanning" — a green line sweeps left to right
   - After 1.5 seconds, reveals the main UI
   - Caption: "Initializing Protocol Analyzer..."

5. Ensure all C functions have Doxygen-style comments.

Commit: "polish: recruiter-ready README, about modal, oscilloscope loading screen"
Push.

Tag the release: git tag v1.0.0 && git push --tags
```

---

## 🏁 Submission Checklist

Before sending the GitHub link to Valeo:

- [ ] All 9 prompts executed and pushed
- [ ] CI badge is green on README
- [ ] `docker-compose up --build` starts everything cleanly
- [ ] Dashboard loads and all 3 protocols work
- [ ] MISRA_COMPLIANCE_NOTES.md and ASPICE_TRACEABILITY.md exist and are detailed
- [ ] Screenshot or GIF in README
- [ ] Repo is public

---

## 💼 How to Use This in Your Cover Letter

> *"To demonstrate my protocol-level understanding and commitment to automotive software quality standards, I built a UART/SPI/I2C Protocol Analyzer from scratch in C, with MISRA C:2012 compliance documentation and an ASPICE SWE traceability matrix — viewable at github.com/abhisheksharma/embedded-protocol-analyzer."*

That one sentence will make you stand out from 90% of applicants.

---

*Built to target: Valeo, Aptiv, Continental, Bosch, Visteon, ZF — any Tier-1 automotive supplier hiring embedded/systems engineers in Ireland/Europe.*
