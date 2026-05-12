/**
 * @file test_frames.c
 * @brief Unit tests for UART and SPI frame simulators (assert-based)
 *
 * ASPICE Reference: SWE.4 Software Unit Verification
 */
#include <assert.h>
#include <stdint.h>

#include "spi_sim.h"
#include "uart_sim.h"

static void test_no_parity_valid(void)
{
    uart_config_t cfg;
    uart_frame_t f;
    int v;

    cfg.parity = UART_PARITY_NONE;
    cfg.stop_bits = UART_STOP_1;
    f = uart_build_frame(0x55, cfg);
    v = uart_validate_frame(f);
    assert(v == UART_OK);
}

static void test_even_parity_valid(void)
{
    uart_config_t cfg;
    uart_frame_t f;
    int v;

    cfg.parity = UART_PARITY_EVEN;
    cfg.stop_bits = UART_STOP_1;
    f = uart_build_frame(0xA5, cfg);
    v = uart_validate_frame(f);
    assert(v == UART_OK);
}

static void test_corrupted_parity_fails(void)
{
    uart_config_t cfg;
    uart_frame_t f;
    int v;
    uint8_t pidx;

    cfg.parity = UART_PARITY_EVEN;
    cfg.stop_bits = UART_STOP_1;
    f = uart_build_frame(0x3C, cfg);
    pidx = (uint8_t)(1U + 8U);
    f.bits[pidx] = (uint8_t)(f.bits[pidx] ^ 1U);
    v = uart_validate_frame(f);
    assert(v == UART_ERR_PARITY);
}

static void test_two_stop_bits_build(void)
{
    uart_config_t cfg;
    uart_frame_t f;
    int v;
    uint8_t n;

    cfg.parity = UART_PARITY_NONE;
    cfg.stop_bits = UART_STOP_2;
    f = uart_build_frame(0x00, cfg);
    assert(f.bit_count == (uint8_t)(1U + 8U + 2U));
    n = (uint8_t)(f.bit_count - 2U);
    assert(f.bits[n] == 1U);
    assert(f.bits[(uint8_t)(n + 1U)] == 1U);
    v = uart_validate_frame(f);
    assert(v == UART_OK);
}

static void test_all_data_bytes_valid(void)
{
    uart_config_t cfg;
    uint16_t d;
    uart_frame_t f;
    int v;

    cfg.parity = UART_PARITY_NONE;
    cfg.stop_bits = UART_STOP_1;

    for (d = 0U; d < 256U; d++) {
        f = uart_build_frame((uint8_t)d, cfg);
        v = uart_validate_frame(f);
        assert(v == UART_OK);
    }
}

static void test_spi_mode0_builds(void)
{
    spi_config_t cfg;
    spi_frame_t f;

    cfg.mode = SPI_MODE_0;
    cfg.cs_active_low = 1U;
    cfg.bit_order = SPI_BIT_ORDER_MSB_FIRST;
    f = spi_build_frame(0xA5, cfg);
    assert(f.mode == SPI_MODE_0);
    assert(f.data == 0xA5);
    assert(f.mosi_bits[0U] == 1U);
}

static void test_spi_msb_lsb_bit_reverse(void)
{
    spi_config_t cfg_msb;
    spi_config_t cfg_lsb;
    spi_frame_t f_msb;
    spi_frame_t f_lsb;
    uint8_t i;
    uint8_t data;

    data = 0xC3;
    cfg_msb.mode = SPI_MODE_0;
    cfg_msb.cs_active_low = 1U;
    cfg_msb.bit_order = SPI_BIT_ORDER_MSB_FIRST;
    cfg_lsb.mode = SPI_MODE_0;
    cfg_lsb.cs_active_low = 1U;
    cfg_lsb.bit_order = SPI_BIT_ORDER_LSB_FIRST;
    f_msb = spi_build_frame(data, cfg_msb);
    f_lsb = spi_build_frame(data, cfg_lsb);

    for (i = 0U; i < SPI_DATA_BITS; i++) {
        assert(f_msb.mosi_bits[i] == f_lsb.mosi_bits[(uint8_t)(7U - i)]);
    }
}

static void test_spi_clock_edge_count(void)
{
    assert(SPI_CLOCK_EDGES == (uint8_t)(2U * SPI_DATA_BITS));
}

static void test_spi_clock_spacing_scales_with_freq(void)
{
    spi_config_t cfg;
    spi_frame_t f_1mhz;
    spi_frame_t f_10mhz;
    uint32_t step_1;
    uint32_t step_10;

    cfg.mode = SPI_MODE_0;
    cfg.cs_active_low = 1U;
    cfg.bit_order = SPI_BIT_ORDER_MSB_FIRST;
    f_1mhz = spi_build_frame(0x00, cfg);
    f_10mhz = spi_build_frame(0x00, cfg);
    spi_simulate_clock_edges(&f_1mhz, 1000000U);
    spi_simulate_clock_edges(&f_10mhz, 10000000U);

    step_1 = f_1mhz.clock_edges[1U] - f_1mhz.clock_edges[0U];
    step_10 = f_10mhz.clock_edges[1U] - f_10mhz.clock_edges[0U];
    assert(step_1 == (10U * step_10));
}

int main(void)
{
    test_no_parity_valid();
    test_even_parity_valid();
    test_corrupted_parity_fails();
    test_two_stop_bits_build();
    test_all_data_bytes_valid();
    test_spi_mode0_builds();
    test_spi_msb_lsb_bit_reverse();
    test_spi_clock_edge_count();
    test_spi_clock_spacing_scales_with_freq();
    return 0;
}
