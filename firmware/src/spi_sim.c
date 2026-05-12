/**
 * @file spi_sim.c
 * @brief SPI frame simulator with clock edge timing — MISRA C:2012 compliant subset
 *
 * MISRA Rules Applied:
 *   Rule 15.5  — Single point of exit per function
 *   Rule 17.7  — Return values of non-void functions always used by callers
 *   Rule 21.6  — No stdio in production path (spi_print_frame guarded by DEBUG)
 *   Rule 14.4  — Boolean expressions only in if/while conditions
 *   Rule 18.1  — Pointer arithmetic and indexing kept within array bounds
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#include "spi_sim.h"

#include <stddef.h>

#ifndef DEBUG
#else
#include <stdio.h>
#endif

static uint8_t mode_is_valid(spi_mode_t mode)
{
    uint8_t ok;

    if ((mode == SPI_MODE_0) || (mode == SPI_MODE_1) || (mode == SPI_MODE_2) || (mode == SPI_MODE_3)) {
        ok = 1U;
    } else {
        ok = 0U;
    }

    return ok;
}

static void fill_mosi_bits(spi_frame_t *frame, uint8_t data, spi_bit_order_t order)
{
    uint8_t t;
    uint8_t bit_index;
    uint8_t v;

    if (frame == NULL) {
        /* MISRA: no action */
    } else {
        for (t = 0U; t < SPI_DATA_BITS; t++) {
            if (order == SPI_BIT_ORDER_MSB_FIRST) {
                bit_index = (uint8_t)(7U - t);
            } else {
                bit_index = t;
            }
            v = (uint8_t)((data >> bit_index) & 1U);
            frame->mosi_bits[t] = v;
        }
    }
}

spi_frame_t spi_build_frame(uint8_t data, spi_config_t config)
{
    spi_frame_t frame;
    uint8_t i;

    if (mode_is_valid(config.mode) != 0U) {
        frame.mode = config.mode;
    } else {
        frame.mode = SPI_MODE_0;
    }

    frame.cs_active_low = config.cs_active_low;
    frame.bit_order = config.bit_order;
    frame.data = data;

    for (i = 0U; i < SPI_CLOCK_EDGES; i++) {
        frame.clock_edges[i] = 0U;
    }

    fill_mosi_bits(&frame, data, config.bit_order);

    return frame;
}

void spi_simulate_clock_edges(spi_frame_t *frame, uint32_t freq_hz)
{
    uint8_t i;
    uint64_t half_ns;
    uint64_t t_ns;

    if (frame == NULL) {
        /* no-op */
    } else {
        if (freq_hz == 0U) {
            half_ns = 1ULL;
        } else {
            half_ns = 1000000000ULL / (2ULL * (uint64_t)freq_hz);
            if (half_ns == 0ULL) {
                half_ns = 1ULL;
            }
        }

        for (i = 0U; i < SPI_CLOCK_EDGES; i++) {
            t_ns = (uint64_t)i * half_ns;
            if (t_ns > 0xFFFFFFFFULL) {
                frame->clock_edges[i] = 0xFFFFFFFFU;
            } else {
                frame->clock_edges[i] = (uint32_t)t_ns;
            }
        }
    }
}

#ifdef DEBUG
static uint8_t cpol_from_mode(spi_mode_t mode)
{
    uint8_t cpol;

    if ((mode == SPI_MODE_2) || (mode == SPI_MODE_3)) {
        cpol = 1U;
    } else {
        cpol = 0U;
    }

    return cpol;
}

static uint8_t cpha_from_mode(spi_mode_t mode)
{
    uint8_t cpha;

    if ((mode == SPI_MODE_1) || (mode == SPI_MODE_3)) {
        cpha = 1U;
    } else {
        cpha = 0U;
    }

    return cpha;
}
#endif

void spi_print_frame(spi_frame_t frame)
{
#ifdef DEBUG
    uint8_t i;
    uint8_t cpol;
    uint8_t cpha;

    cpol = cpol_from_mode(frame.mode);
    cpha = cpha_from_mode(frame.mode);

    (void)printf("SPI frame: data=0x%02X mode=%u CPOL=%u CPHA=%u CS_active_low=%u bit_order=%u\n",
                 (unsigned int)frame.data,
                 (unsigned int)frame.mode,
                 (unsigned int)cpol,
                 (unsigned int)cpha,
                 (unsigned int)frame.cs_active_low,
                 (unsigned int)frame.bit_order);

    (void)printf("  MOSI bits (first on wire): ");
    for (i = 0U; i < SPI_DATA_BITS; i++) {
        (void)printf("%u", (unsigned int)frame.mosi_bits[i]);
    }
    (void)printf("\n");

    (void)printf("  MISO (loopback model): same as MOSI\n");
    (void)printf("  CLK: 8 cycles, idle per CPOL; edges at ns timestamps below\n");
    (void)printf("  CS: %s when selected\n", (frame.cs_active_low != 0U) ? "LOW" : "HIGH");

    for (i = 0U; i < SPI_CLOCK_EDGES; i++) {
        (void)printf("  edge[%u] t=%u ns\n", (unsigned int)i, (unsigned int)frame.clock_edges[i]);
    }
#else
    (void)frame;
#endif
}
