/**
 * @file main.c
 * @brief CLI entry: builds protocol frames and prints a single JSON object on stdout.
 *
 * Usage:
 *   protocol_analyzer uart   <data> <none|even|odd> <1|2>
 *   protocol_analyzer spi    <data> <0-3> <msb|lsb> <freq_hz>
 *   protocol_analyzer i2c    <addr> <read|write> [hex_bytes_csv]
 *
 * ASPICE Reference: SWE.3 — executable unit for bridge integration.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "i2c_sim.h"
#include "spi_sim.h"
#include "uart_sim.h"

static int parse_uart_parity(const char *s, uart_parity_t *out)
{
    int err = 1;

    if (strcmp(s, "none") == 0) {
        *out = UART_PARITY_NONE;
        err = 0;
    } else if (strcmp(s, "even") == 0) {
        *out = UART_PARITY_EVEN;
        err = 0;
    } else if (strcmp(s, "odd") == 0) {
        *out = UART_PARITY_ODD;
        err = 0;
    } else {
        /* invalid */
    }

    return err;
}

static int parse_uart_stops(const char *s, uart_stop_t *out)
{
    int err = 1;

    if (strcmp(s, "1") == 0) {
        *out = UART_STOP_1;
        err = 0;
    } else if (strcmp(s, "2") == 0) {
        *out = UART_STOP_2;
        err = 0;
    } else {
        /* invalid */
    }

    return err;
}

static void emit_uart_json(const uart_frame_t *f, int valid)
{
    uint8_t i;
    uint8_t parity_idx;

    (void)printf("{\"protocol\":\"uart\",\"data\":%u,\"valid\":%s,\"bit_count\":%u,\"bits\":[",
                 (unsigned int)f->data,
                 (valid != 0) ? "true" : "false",
                 (unsigned int)f->bit_count);

    for (i = 0U; i < f->bit_count; i++) {
        if (i > 0U) {
            (void)printf(",");
        }
        (void)printf("%u", (unsigned int)f->bits[i]);
    }

    (void)printf("],\"parity_bit\":");
    if (f->config.parity == UART_PARITY_NONE) {
        (void)printf("null");
    } else {
        parity_idx = 9U;
        (void)printf("%u", (unsigned int)f->bits[parity_idx]);
    }
    (void)printf("}\n");
}

static int cmd_uart(int argc, char **argv)
{
    unsigned long data_ul;
    uart_parity_t parity;
    uart_stop_t stops;
    uart_config_t cfg;
    uart_frame_t frame;
    int valid;
    int err = 1;

    if (argc == 5) {
        data_ul = strtoul(argv[2], NULL, 0);
        if ((data_ul <= 255UL) && (parse_uart_parity(argv[3], &parity) == 0) &&
            (parse_uart_stops(argv[4], &stops) == 0)) {
            cfg.parity = parity;
            cfg.stop_bits = stops;
            frame = uart_build_frame((uint8_t)data_ul, cfg);
            valid = uart_validate_frame(frame);
            emit_uart_json(&frame, (valid == UART_OK) ? 1 : 0);
            err = 0;
        }
    }

    return err;
}

static int parse_spi_order(const char *s, spi_bit_order_t *out)
{
    int err = 1;

    if (strcmp(s, "msb") == 0) {
        *out = SPI_BIT_ORDER_MSB_FIRST;
        err = 0;
    } else if (strcmp(s, "lsb") == 0) {
        *out = SPI_BIT_ORDER_LSB_FIRST;
        err = 0;
    } else {
        /* invalid */
    }

    return err;
}

static void emit_spi_json(spi_frame_t *f)
{
    uint8_t i;

    (void)printf("{\"protocol\":\"spi\",\"data\":%u,\"mode\":%u,\"cs_active_low\":%u,\"bit_order\":\"%s\",",
                 (unsigned int)f->data,
                 (unsigned int)f->mode,
                 (unsigned int)f->cs_active_low,
                 (f->bit_order == SPI_BIT_ORDER_MSB_FIRST) ? "msb" : "lsb");

    (void)printf("\"clock_edges_ns\":[");
    for (i = 0U; i < SPI_CLOCK_EDGES; i++) {
        if (i > 0U) {
            (void)printf(",");
        }
        (void)printf("%lu", (unsigned long)f->clock_edges[i]);
    }
    (void)printf("],\"mosi_bits\":[");
    for (i = 0U; i < SPI_DATA_BITS; i++) {
        if (i > 0U) {
            (void)printf(",");
        }
        (void)printf("%u", (unsigned int)f->mosi_bits[i]);
    }
    (void)printf("]}\n");
}

static int cmd_spi(int argc, char **argv)
{
    unsigned long data_ul;
    unsigned long mode_ul;
    unsigned long freq_ul;
    spi_bit_order_t order;
    spi_config_t cfg;
    spi_frame_t frame;
    int err = 1;

    if (argc == 6) {
        data_ul = strtoul(argv[2], NULL, 0);
        mode_ul = strtoul(argv[3], NULL, 0);
        freq_ul = strtoul(argv[5], NULL, 0);
        if ((data_ul <= 255UL) && (mode_ul <= 3UL) && (parse_spi_order(argv[4], &order) == 0) &&
            (freq_ul <= 0xFFFFFFFFUL)) {
            cfg.mode = (spi_mode_t)mode_ul;
            cfg.cs_active_low = 1U;
            cfg.bit_order = order;
            frame = spi_build_frame((uint8_t)data_ul, cfg);
            spi_simulate_clock_edges(&frame, (uint32_t)freq_ul);
            emit_spi_json(&frame);
            err = 0;
        }
    }

    return err;
}

static int parse_i2c_csv(const char *csv, uint8_t *buf, uint8_t *out_len)
{
    const char *p;
    uint8_t len = 0U;
    int err = 0;

    if (csv == NULL) {
        *out_len = 0U;
    } else if (csv[0] == '\0') {
        *out_len = 0U;
    } else {
        p = csv;
        while ((*p != '\0') && (err == 0)) {
            unsigned long v;
            char *endp = NULL;

            v = strtoul(p, &endp, 0);
            if (endp == p) {
                err = 1;
            } else if (v > 255UL) {
                err = 1;
            } else {
                if (len >= I2C_MAX_DATA_BYTES) {
                    err = 1;
                } else {
                    buf[len] = (uint8_t)v;
                    len++;
                }
            }

            if (err == 0) {
                if (*endp == '\0') {
                    p = endp;
                } else if (*endp == ',') {
                    p = endp + 1;
                } else {
                    err = 1;
                }
            }
        }
        *out_len = len;
    }

    return err;
}

static void emit_i2c_json(const i2c_frame_t *f)
{
    uint8_t i;

    (void)printf("{\"protocol\":\"i2c\",\"address\":%u,\"rw\":\"%s\",\"ack_received\":%s,\"data_len\":%u,",
                 (unsigned int)f->address,
                 (f->rw_bit != 0U) ? "read" : "write",
                 (f->ack_received != false) ? "true" : "false",
                 (unsigned int)f->data_len);

    (void)printf("\"data\":[");
    for (i = 0U; i < f->data_len; i++) {
        if (i > 0U) {
            (void)printf(",");
        }
        (void)printf("%u", (unsigned int)f->data[i]);
    }
    (void)printf("],\"error_code\":%d}\n", f->error_code);
}

static int cmd_i2c(int argc, char **argv)
{
    unsigned long addr_ul;
    uint8_t rw;
    uint8_t buf[I2C_MAX_DATA_BYTES];
    uint8_t blen = 0U;
    i2c_frame_t frame;
    const char *csv;
    int err = 1;
    uint8_t rw_ok;

    rw_ok = 0U;
    if ((argc == 4) || (argc == 5)) {
        addr_ul = strtoul(argv[2], NULL, 0);
        if (strcmp(argv[3], "write") == 0) {
            rw = I2C_RW_WRITE;
            rw_ok = 1U;
        } else if (strcmp(argv[3], "read") == 0) {
            rw = I2C_RW_READ;
            rw_ok = 1U;
        } else {
            /* invalid rw */
        }

        if (argc == 5) {
            csv = argv[4];
        } else {
            csv = NULL;
        }

        if ((rw_ok != 0U) && (addr_ul <= 127UL) && (parse_i2c_csv(csv, buf, &blen) == 0)) {
            if (blen > 0U) {
                frame = i2c_build_frame((uint8_t)addr_ul, rw, buf, blen);
            } else {
                frame = i2c_build_frame((uint8_t)addr_ul, rw, NULL, 0U);
            }
            emit_i2c_json(&frame);
            err = 0;
        }
    }

    return err;
}

int main(int argc, char **argv)
{
    int err = 1;

    if (argc > 1) {
        if (strcmp(argv[1], "uart") == 0) {
            err = cmd_uart(argc, argv);
        } else if (strcmp(argv[1], "spi") == 0) {
            err = cmd_spi(argc, argv);
        } else if (strcmp(argv[1], "i2c") == 0) {
            err = cmd_i2c(argc, argv);
        } else {
            /* unknown */
        }
    }

    return err;
}
