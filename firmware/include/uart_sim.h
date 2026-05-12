/**
 * @file uart_sim.h
 * @brief UART frame simulator API — MISRA C:2012 aware subset
 *
 * MISRA Rules Applied (implementation):
 *   Rule 8.6  — One definition per external object/function
 *   Rule 17.3 — No implicit function declarations (stdint.h, explicit types)
 *
 * ASPICE Reference: SWE.3 Software Detailed Design
 */
#ifndef UART_SIM_H
#define UART_SIM_H

#include <stdint.h>

typedef enum {
    UART_PARITY_NONE = 0,
    UART_PARITY_EVEN = 1,
    UART_PARITY_ODD = 2
} uart_parity_t;

typedef enum {
    UART_STOP_1 = 0,
    UART_STOP_2 = 1
} uart_stop_t;

typedef struct {
    uart_parity_t parity;
    uart_stop_t stop_bits;
} uart_config_t;

#define UART_MAX_FRAME_BITS (12U)

typedef struct {
    uint8_t data;
    uart_config_t config;
    uint8_t bit_count;
    uint8_t bits[UART_MAX_FRAME_BITS];
} uart_frame_t;

/** @brief Non-zero error codes for uart_validate_frame */
enum {
    UART_OK = 0,
    UART_ERR_START = 1,
    UART_ERR_DATA = 2,
    UART_ERR_PARITY = 3,
    UART_ERR_STOP = 4,
    UART_ERR_LENGTH = 5
};

uart_frame_t uart_build_frame(uint8_t data, uart_config_t config);
int uart_validate_frame(uart_frame_t frame);
void uart_print_frame(uart_frame_t frame);

#endif /* UART_SIM_H */
