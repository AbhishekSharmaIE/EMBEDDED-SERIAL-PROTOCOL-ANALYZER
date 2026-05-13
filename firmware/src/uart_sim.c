/**
 * @file uart_sim.c
 * @brief UART frame simulator — MISRA C:2012 compliant subset
 *
 * MISRA Rules Applied:
 *   Rule 15.5  — Single point of exit per function
 *   Rule 17.7  — Return value of non-void functions always used (callers/tests)
 *   Rule 21.6  — No stdio.h in production path (uart_print_frame guarded by DEBUG)
 *   Rule 14.4  — Boolean expressions only in if/while conditions
 *   Rule 10.3  — No implicit widening/narrowing without intent (explicit casts)
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#include "uart_sim.h"

#include <stddef.h>

#ifndef DEBUG
/* Production: no stdio */
#else
#include <stdio.h>
#endif

#define UART_START_VALUE   (0U)
#define UART_STOP_VALUE    (1U)
#define UART_DATA_BITS     (8U)

/**
 * @brief Count bits set to 1 in an 8-bit value.
 * @param[in] value Byte to inspect.
 * @return Number of set bits (0..8).
 */
static uint8_t count_one_bits_u8(uint8_t value)
{
    uint8_t count = 0U;
    uint8_t i;

    for (i = 0U; i < UART_DATA_BITS; i++) {
        if ((value & ((uint8_t)1U << i)) != 0U) {
            count++;
        }
    }

    return count;
}

/**
 * @brief Even-parity bit for eight data bits.
 * @param[in] data Payload byte.
 * @return Parity bit value 0 or 1.
 */
static uint8_t parity_bit_even(uint8_t data)
{
    uint8_t ones;
    uint8_t p;

    ones = count_one_bits_u8(data);
    p = (uint8_t)((ones % 2U) != 0U ? 1U : 0U);
    return p;
}

/**
 * @brief Odd-parity bit for eight data bits.
 * @param[in] data Payload byte.
 * @return Parity bit value 0 or 1.
 */
static uint8_t parity_bit_odd(uint8_t data)
{
    uint8_t ones;
    uint8_t p;

    ones = count_one_bits_u8(data);
    p = (uint8_t)((ones % 2U) == 0U ? 1U : 0U);
    return p;
}

/**
 * @brief Build a UART frame bit sequence (start, LSB-first data, optional parity, stop(s)).
 * @param[in] data Payload byte (0..255).
 * @param[in] config Parity mode and stop-bit count.
 * @return Frame structure with @c bits[] and @c bit_count populated.
 */
uart_frame_t uart_build_frame(uint8_t data, uart_config_t config)
{
    uart_frame_t frame;
    uint8_t idx = 0U;
    uint8_t i;
    uint8_t pbit;
    uint8_t stop_count;

    frame.data = data;
    frame.config = config;
    frame.bit_count = 0U;

    frame.bits[idx] = UART_START_VALUE;
    idx++;

    for (i = 0U; i < UART_DATA_BITS; i++) {
        frame.bits[idx] = (uint8_t)((data >> i) & 1U);
        idx++;
    }

    if (config.parity == UART_PARITY_EVEN) {
        pbit = parity_bit_even(data);
        frame.bits[idx] = pbit;
        idx++;
    } else if (config.parity == UART_PARITY_ODD) {
        pbit = parity_bit_odd(data);
        frame.bits[idx] = pbit;
        idx++;
    } else {
        /* UART_PARITY_NONE: no parity bit */
    }

    if (config.stop_bits == UART_STOP_2) {
        stop_count = 2U;
    } else {
        stop_count = 1U;
    }

    for (i = 0U; i < stop_count; i++) {
        frame.bits[idx] = UART_STOP_VALUE;
        idx++;
    }

    frame.bit_count = idx;

    return frame;
}

/**
 * @brief Validate a previously built UART frame.
 * @param[in] frame Frame to check (must match @c frame.config used at build time).
 * @return @ref UART_OK if valid; otherwise a @c UART_ERR_* code.
 */
int uart_validate_frame(uart_frame_t frame)
{
    int result = UART_OK;
    uint8_t idx;
    uint8_t i;
    uint8_t expected;
    uint8_t pexp;
    uint8_t first_stop_idx;
    uint8_t expected_len;
    uint8_t stop_count;

    if (frame.config.stop_bits == UART_STOP_2) {
        stop_count = 2U;
    } else {
        stop_count = 1U;
    }

    if (frame.config.parity == UART_PARITY_NONE) {
        expected_len = (uint8_t)(1U + UART_DATA_BITS + stop_count);
    } else {
        expected_len = (uint8_t)(1U + UART_DATA_BITS + 1U + stop_count);
    }

    if (frame.bit_count != expected_len) {
        result = UART_ERR_LENGTH;
    } else if (frame.bits[0] != UART_START_VALUE) {
        result = UART_ERR_START;
    } else {
        idx = 1U;
        for (i = 0U; i < UART_DATA_BITS; i++) {
            expected = (uint8_t)((frame.data >> i) & 1U);
            if (frame.bits[idx] != expected) {
                result = UART_ERR_DATA;
                break;
            }
            idx++;
        }

        if (result == UART_OK) {
            if (frame.config.parity == UART_PARITY_EVEN) {
                pexp = parity_bit_even(frame.data);
                if (frame.bits[idx] != pexp) {
                    result = UART_ERR_PARITY;
                }
                idx++;
            } else if (frame.config.parity == UART_PARITY_ODD) {
                pexp = parity_bit_odd(frame.data);
                if (frame.bits[idx] != pexp) {
                    result = UART_ERR_PARITY;
                }
                idx++;
            } else {
                /* none */
            }
        }

        if (result == UART_OK) {
            first_stop_idx = idx;
            for (i = 0U; i < stop_count; i++) {
                if (frame.bits[(uint8_t)(first_stop_idx + i)] != UART_STOP_VALUE) {
                    result = UART_ERR_STOP;
                }
            }
        }
    }

    return result;
}

/**
 * @brief Print frame contents to stdout (DEBUG builds only).
 * @param[in] frame Frame to dump.
 */
void uart_print_frame(uart_frame_t frame)
{
#ifdef DEBUG
    uint8_t i;

    (void)printf("UART frame: data=0x%02X parity=%d stops=%d bits=%u\n",
                 (unsigned int)frame.data,
                 (int)frame.config.parity,
                 (int)frame.config.stop_bits,
                 (unsigned int)frame.bit_count);
    for (i = 0U; i < frame.bit_count; i++) {
        (void)printf("  bit[%u] = %u\n", (unsigned int)i, (unsigned int)frame.bits[i]);
    }
#else
    (void)frame;
#endif
}
