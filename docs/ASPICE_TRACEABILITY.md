# ASPICE SWE Traceability Matrix

## Introduction

**Automotive SPICE** (Software Process Improvement and Capability dEtermination) is a process reference model used to assess and improve software development in the automotive supply chain. **SWE** (Software Engineering) process groups cover requirements, design, implementation, integration, and testing. Tier-1 suppliers (e.g. Valeo, Continental, Bosch) and OEMs often require **ASPICE-capable** evidence from suppliers: traceable work products from design through verification.

This document maps **selected artifacts** in this repository to **ASPICE SWE** process areas as a **lightweight traceability** example for education and portfolio use—not a full ASPICE assessment.

## Artifact Traceability

| Artifact | ASPICE process | Work product (illustrative) |
| --- | --- | --- |
| `firmware/include/uart_sim.h`, `firmware/src/uart_sim.c` | **SWE.3** Software detailed design and unit construction | Software unit (UART frame model) |
| `firmware/include/spi_sim.h`, `firmware/src/spi_sim.c` | **SWE.3** | Software unit (SPI frame / timing model) |
| `firmware/include/i2c_sim.h`, `firmware/src/i2c_sim.c` | **SWE.3** | Software unit (I2C transaction model) |
| `firmware/src/main.c` | **SWE.3** | Software unit (CLI / JSON bridge contract) |
| `firmware/tests/test_frames.c` | **SWE.4** Software unit verification | Unit test specification & results (assert-based) |
| `firmware/Makefile` | **SWE.4** | Build & test procedure for units |
| `docs/MISRA_COMPLIANCE_NOTES.md` | **SWE.3** | Design / coding standard evidence (MISRA subset) |
| `.github/workflows/ci.yml` | **SWE.4** | Automated verification execution record |
| `bridge/api.py` | **SWE.3** / **SWE.5** | Detailed design of software component (API); integration helper (invokes firmware) |
| `dashboard/src/**` (React UI) | **SWE.3** / **SWE.2** | Software component design; optional link to software architectural design (UI layer) |
| `docker-compose.yml`, `bridge/Dockerfile`, `dashboard/Dockerfile` | **SWE.5** / **SWE.6** | Build & deployment packaging (integration / delivery support) |

*ASPICE process IDs follow common PAM naming; exact mapping may vary by assessor and OEM template.*

## Verification Strategy

1. **Unit tests (C)** — `firmware/tests/test_frames.c` exercises UART, SPI, and I2C simulators with `assert()`. Run via `make test` in `firmware/`; output is also tee’d to `firmware/tests/test_output.txt` for CI artifacts on failure.

2. **CI automation** — GitHub Actions workflow builds firmware, runs tests, smoke-imports the Python bridge, builds the dashboard, and (in the bridge job) can hit `/health` when the API is started. This provides a **repeatable** verification baseline.

3. **Bridge contract** — The C CLI emits **single-line JSON** per invocation; the FastAPI layer parses stdout and maps errors to HTTP responses. Manual or automated checks against `/pa/*/frame` validate end-to-end behaviour.

4. **Code review checklist (suggested)**  
   - Confirm bounds on all array writes and payload lengths.  
   - Confirm single-return / explicit-boolean style matches project headers.  
   - Confirm no `stdio` in simulator “production” paths unless `DEBUG`.  
   - Confirm new protocol fields are reflected in `main.c` JSON and dashboard types.

---

*This matrix is illustrative for learning and portfolio purposes; a formal ASPICE assessment requires a defined scope, supplier process, and assessor evidence beyond this repository.*
