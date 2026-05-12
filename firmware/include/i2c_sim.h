/**
 * @file i2c_sim.h
 * @brief I2C transaction frame simulator API — MISRA C:2012 aware subset
 *
 * MISRA Rules Applied (implementation):
 *   Rule 1.3  — No undefined behaviour (bounds-checked copies and indexing)
 *   Rule 8.6  — One definition per external object/function
 *   Rule 17.3 — No implicit function declarations (explicit includes and types)
 *   Rule 18.1 — Pointer and array access kept within bounds
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#ifndef I2C_SIM_H
#define I2C_SIM_H

#include <stdbool.h>
#include <stdint.h>

#define I2C_MAX_DATA_BYTES (32U)

#define I2C_RW_WRITE (0U)
#define I2C_RW_READ  (1U)

enum {
    I2C_OK = 0,
    I2C_ERR_ADDR = 1,
    I2C_ERR_LEN = 2,
    I2C_ERR_PARAM = 3
};

typedef struct {
    uint8_t address; /* 7-bit device address */
    uint8_t rw_bit;  /* 0 = write (master -> slave), 1 = read */
    bool ack_received;
    uint8_t data[I2C_MAX_DATA_BYTES];
    uint8_t data_len;
    int error_code;
} i2c_frame_t;

i2c_frame_t i2c_build_frame(uint8_t addr, uint8_t rw, uint8_t *data, uint8_t len);
int i2c_validate_address(uint8_t addr);
void i2c_print_frame(i2c_frame_t frame);

#endif /* I2C_SIM_H */
