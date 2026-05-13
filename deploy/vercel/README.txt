Linux x86-64 ELF binary of firmware/bin/protocol_analyzer (same as `make -C firmware all` on Ubuntu).
Regenerate after changing C sources:
  cd firmware && make clean && make all && cp bin/protocol_analyzer ../deploy/vercel/protocol_analyzer_linux_amd64 && chmod +x ../deploy/vercel/protocol_analyzer_linux_amd64
