CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -Iinclude
SRCDIR = src
OBJDIR = obj
BINDIR = bin
TESTDIR = tests

SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(patsubst $(SRCDIR)/%.c,$(OBJDIR)/%.o,$(SOURCES))
TARGET = $(BINDIR)/protocol_analyzer

TEST_SRC = $(TESTDIR)/test_frames.c
TEST_OBJ = $(OBJDIR)/tests/test_frames.o
UART_OBJ = $(OBJDIR)/uart_sim.o
SPI_OBJ = $(OBJDIR)/spi_sim.o
I2C_OBJ = $(OBJDIR)/i2c_sim.o
TEST_BIN = $(BINDIR)/test_frames

.PHONY: all clean test

all: $(TARGET)

$(TARGET): $(OBJECTS) | $(BINDIR)
	$(CC) $(OBJECTS) -o $@

$(OBJDIR)/%.o: $(SRCDIR)/%.c | $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJDIR)/tests/%.o: $(TESTDIR)/%.c | $(OBJDIR)/tests
	$(CC) $(CFLAGS) -c $< -o $@

$(TEST_BIN): $(UART_OBJ) $(SPI_OBJ) $(I2C_OBJ) $(TEST_OBJ) | $(BINDIR)
	$(CC) $(UART_OBJ) $(SPI_OBJ) $(I2C_OBJ) $(TEST_OBJ) -o $@

$(OBJDIR) $(BINDIR) $(OBJDIR)/tests:
	mkdir -p $@

test: $(TEST_BIN)
	./$(TEST_BIN)

clean:
	rm -rf $(OBJDIR) $(BINDIR)
