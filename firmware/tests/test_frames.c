/**
 * @file test_frames.c
 * @brief Unit tests for UART frame simulator (assert-based)
 *
 * ASPICE Reference: SWE.4 Software Unit Verification
 */
#include <assert.h>
#include <stdint.h>

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

int main(void)
{
    test_no_parity_valid();
    test_even_parity_valid();
    test_corrupted_parity_fails();
    test_two_stop_bits_build();
    test_all_data_bytes_valid();
    return 0;
}
