# MISRA C:2012 Compliance Notes

## Introduction

**MISRA C** (Motor Industry Software Reliability Association C guidelines) is a set of rules for developing **safe, portable, and maintainable C** code, widely adopted in **automotive** and other **safety-related** domains. MISRA C:2012 is commonly used alongside **ISO 26262** (road vehicle functional safety): MISRA helps reduce language defects and undefined behaviour that could lead to systematic faults; ISO 26262 adds process, evidence, and safety goals. This project applies a **documented subset** of MISRA C:2012 in the firmware layer to demonstrate **quality-aware embedded practice**, not to claim full tool-certified compliance.

## Rules Followed in This Codebase

The table below lists **MISRA C:2012** rules that the firmware intentionally follows or approximates, with references to where they show up in this repository.

| Rule ID | Rule description (summary) | Where applied | Deviation (if any) |
| --- | --- | --- | --- |
| **Rule 1.3** | Avoid undefined behaviour (e.g. bounds violations). | `i2c_sim.c` (payload copy, address checks); `spi_sim.c` (fixed-size loops for clock edges / MOSI bits). | None claimed for all paths; reviews only. |
| **Rule 8.6** | A function shall have a single definition. | All `*.c` / `*.h` units; one implementation per public API. | — |
| **Rule 10.3** | Value assigned to wider type without side effects (avoid sloppy widening). | `uart_sim.c`, `spi_sim.c` (explicit casts where narrowing/widening matters). | Informal; not proven on every cast. |
| **Rule 14.4** | Controlling expressions shall be essentially Boolean where appropriate. | `uart_sim.c`, `spi_sim.c`, `i2c_sim.c` (explicit comparisons, e.g. `!= 0U` rather than using raw integers as conditions). | — |
| **Rule 15.5** | A function shall have a single point of exit at the end. | `uart_validate_frame`, `i2c_validate_address`, and similar control flow. | Some helpers use early returns in trivial cases; main CLI uses multiple returns for subcommands. |
| **Rule 17.3** | No implicit declaration of functions; include headers. | All modules include `<stdint.h>` / project headers; no implicit `int` declarations. | — |
| **Rule 17.7** | Return value of non-void functions shall be used or explicitly discarded. | Call sites use results (e.g. validation); `(void)` casts used where discarding is intentional. | — |
| **Rule 18.1** | Pointer arithmetic / indexing shall stay within bounds. | `spi_sim.c` (SPI edge array indexing); `i2c_sim.c` (payload length vs `I2C_MAX_DATA_BYTES`). | — |
| **Rule 21.6** | Standard library input/output shall not be used in production code paths. | `uart_print_frame`, `spi_print_frame`, `i2c_print_frame` gated with `#ifdef DEBUG`; `main.c` CLI prints JSON to stdout by design for the bridge. | **Deviation:** `main.c` uses `printf` for JSON emission (tooling contract, not “production ECU” firmware). |
| **Rule 12.2** | Right-hand operand of shift shall be in range for the promoted type. | `uart_sim.c`, `spi_sim.c`, `i2c_sim.c` (shifts use small constants / bounded loop indices `0..7`). | Variable shifts not formally range-proved without static analysis. |

Additional rules are cited in file header comments (e.g. **Rule 21.6** on stdio, **Rule 18.1** on SPI) as **design intent** for reviewers and hiring signal.

## Rules Not Applied (or Not Fully Enforced) and Why

The following are representative of MISRA rules that typically require **static analysis tools**, formal deviation records, and organisational process—beyond what a small open-source demo can claim:

1. **Rule 8.7** (functions should not be defined with variable number of arguments) — Not applicable here (no `printf`-style variadics in simulators); more broadly, **full MISRA enforcement** uses tools to catch macro-generated variadic misuse.

2. **Rule 14.2** (loops with well-defined bounds) — Bounded loops are used by design, but **proving** all loops and all recursion depth is left to **static analysis** (e.g. **Polyspace**, **PC-lint Plus**) and peer review.

3. **Rule 17.2** (functions shall not call themselves recursively) — Not used in core simulators; global MISRA compliance in large codebases is checked by tools.

4. **Directive 4.14** (error handling / runtime failures) — This project uses simple error codes and HTTP-layer errors in the bridge; a full automotive safety case would require systematic failure analysis and tool-assisted verification.

**Polyspace** (MathWorks) and **PC-lint Plus** (Flexel) are examples of **static analysis** products used in automotive workflows: they encode MISRA (and custom) rules, report violations, support **suppressions with justification**, and integrate into CI. They complement—not replace—architecture, coding standards, and testing.

---

*This project simulates MISRA compliance awareness; full compliance requires certified static analysis tooling, deviation procedures, and organisational process as defined by the OEM / supplier.*
