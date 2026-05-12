/**
 * @file spi_sim.h
 * @brief SPI frame simulator API — MISRA C:2012 aware subset
 *
 * MISRA Rules Applied (implementation):
 *   Rule 8.6  — One definition per external object/function
 *   Rule 17.3 — No implicit function declarations
 *   Rule 18.1 — Pointer arithmetic and indexing kept within array bounds
 *
 * clock_edges[] stores each edge time from the start of the frame in
 * **nanoseconds** (uint32_t) so sub-microsecond spacing is representable at
 * multi-MHz SPI; callers may convert to microseconds when displaying.
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#ifndef SPI_SIM_H
#define SPI_SIM_H

#include <stdint.h>

#define SPI_DATA_BITS       (8U)
#define SPI_CLOCK_EDGES     (16U) /* two edges per data bit */

typedef enum {
    SPI_MODE_0 = 0,
    SPI_MODE_1 = 1,
    SPI_MODE_2 = 2,
    SPI_MODE_3 = 3
} spi_mode_t;

typedef enum {
    SPI_BIT_ORDER_MSB_FIRST = 0,
    SPI_BIT_ORDER_LSB_FIRST = 1
} spi_bit_order_t;

typedef struct {
    spi_mode_t mode;
    uint8_t cs_active_low; /* 0 = active high CS, 1 = active low CS */
    spi_bit_order_t bit_order;
} spi_config_t;

typedef struct {
    spi_mode_t mode;
    uint8_t cs_active_low;
    spi_bit_order_t bit_order;
    uint8_t data;
    /** Edge timestamps from frame start, nanoseconds (see file header). */
    uint32_t clock_edges[SPI_CLOCK_EDGES];
    /** MOSI line value during each of the 8 bit times (index 0 = first on wire). */
    uint8_t mosi_bits[SPI_DATA_BITS];
} spi_frame_t;

spi_frame_t spi_build_frame(uint8_t data, spi_config_t config);
void spi_simulate_clock_edges(spi_frame_t *frame, uint32_t freq_hz);
void spi_print_frame(spi_frame_t frame);

#endif /* SPI_SIM_H */
