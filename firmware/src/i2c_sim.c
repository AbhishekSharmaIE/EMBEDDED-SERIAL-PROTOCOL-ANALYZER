/**
 * @file i2c_sim.c
 * @brief I2C transaction frame simulator — MISRA C:2012 compliant subset
 *
 * MISRA Rules Applied:
 *   Rule 1.3  — No undefined behaviour (bounds checks, null checks)
 *   Rule 15.5 — Single point of exit per function
 *   Rule 17.3 — No implicit function declarations
 *   Rule 21.6 — No stdio in production path (i2c_print_frame guarded by DEBUG)
 *   Rule 14.4 — Boolean expressions only in if/while conditions
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#include "i2c_sim.h"

#include <stddef.h>

#ifndef DEBUG
#else
#include <stdio.h>
#endif

int i2c_validate_address(uint8_t addr)
{
    int result;

    if (addr > 0x7FU) {
        result = I2C_ERR_ADDR;
    } else if ((addr < 8U) || (addr >= 0x78U)) {
        result = I2C_ERR_ADDR;
    } else {
        result = I2C_OK;
    }

    return result;
}

i2c_frame_t i2c_build_frame(uint8_t addr, uint8_t rw, uint8_t *data, uint8_t len)
{
    i2c_frame_t frame;
    uint8_t i;
    int valid;

    frame.address = addr;
    frame.rw_bit = (uint8_t)(rw & 1U);
    frame.ack_received = false;
    frame.data_len = 0U;
    frame.error_code = I2C_OK;

    for (i = 0U; i < I2C_MAX_DATA_BYTES; i++) {
        frame.data[i] = 0U;
    }

    valid = i2c_validate_address(addr);
    if (valid != I2C_OK) {
        frame.error_code = I2C_ERR_ADDR;
    } else if (len > I2C_MAX_DATA_BYTES) {
        frame.error_code = I2C_ERR_LEN;
    } else if ((len > 0U) && (data == NULL)) {
        frame.error_code = I2C_ERR_PARAM;
    } else {
        frame.data_len = len;
        for (i = 0U; i < len; i++) {
            frame.data[i] = data[i];
        }
        frame.ack_received = true;
    }

    return frame;
}

void i2c_print_frame(i2c_frame_t frame)
{
#ifdef DEBUG
    uint8_t i;

    (void)printf("I2C: START\n");
    (void)printf("  ADDR 7-bit: 0x%02X  R/W: %s\n",
                 (unsigned int)frame.address,
                 (frame.rw_bit != 0U) ? "READ" : "WRITE");
    (void)printf("  ACK from slave: %s\n", (frame.ack_received != false) ? "ACK" : "NACK");
    (void)printf("  DATA (%u bytes):", (unsigned int)frame.data_len);
    for (i = 0U; i < frame.data_len; i++) {
        (void)printf(" %02X", (unsigned int)frame.data[i]);
    }
    (void)printf("\n");
    (void)printf("  STOP\n");
    (void)printf("  error_code=%d\n", frame.error_code);
#else
    (void)frame;
#endif
}
