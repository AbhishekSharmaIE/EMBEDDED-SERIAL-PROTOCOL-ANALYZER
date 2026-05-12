import { Activity, Binary, Cable, Cpu, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import type {
  I2cFrameRequest,
  Parity,
  SpiFrameRequest,
  UartFrameRequest,
} from "../api/client";

export type ProtocolTab = "uart" | "spi" | "i2c";

export type AnalyzePayload =
  | { protocol: "uart"; body: UartFrameRequest }
  | { protocol: "spi"; body: SpiFrameRequest }
  | { protocol: "i2c"; body: I2cFrameRequest };

function parseHexByte(raw: string): number {
  const s = raw.trim().replace(/^0x/i, "");
  if (s.length === 0) return 0;
  const v = Number.parseInt(s, 16);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(255, v));
}

function parseHexAddr7(raw: string): number {
  const s = raw.trim().replace(/^0x/i, "");
  if (s.length === 0) return 0;
  const v = Number.parseInt(s, 16);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(127, v));
}

interface Props {
  active: ProtocolTab;
  onActiveChange: (p: ProtocolTab) => void;
  onAnalyze: (payload: AnalyzePayload) => void;
  loading: boolean;
}

export function ProtocolSelector({ active, onActiveChange, onAnalyze, loading }: Props) {
  const [uartHex, setUartHex] = useState("A5");
  const [uartParity, setUartParity] = useState<Parity>("even");
  const [uartStops2, setUartStops2] = useState(false);

  const [spiHex, setSpiHex] = useState("3C");
  const [spiMode, setSpiMode] = useState(0);
  const [spiMsb, setSpiMsb] = useState(true);
  const [spiFreq, setSpiFreq] = useState(1_000_000);

  const [i2cAddr, setI2cAddr] = useState("48");
  const [i2cRead, setI2cRead] = useState(false);
  const [i2cBytes, setI2cBytes] = useState<string[]>(["01", "FF"]);

  const run = useCallback(() => {
    if (active === "uart") {
      const body: UartFrameRequest = {
        data: parseHexByte(uartHex),
        parity: uartParity,
        stop_bits: uartStops2 ? 2 : 1,
      };
      onAnalyze({ protocol: "uart", body });
      return;
    }
    if (active === "spi") {
      const body: SpiFrameRequest = {
        data: parseHexByte(spiHex),
        mode: Math.max(0, Math.min(3, spiMode)),
        bit_order: spiMsb ? "msb" : "lsb",
        freq_hz: Math.max(100_000, Math.min(10_000_000, spiFreq)),
      };
      onAnalyze({ protocol: "spi", body });
      return;
    }
    const addr = parseHexAddr7(i2cAddr);
    const data = i2cBytes.map((x) => parseHexByte(x)).filter((_, i) => i < 32);
    const body: I2cFrameRequest = {
      address: addr,
      rw: i2cRead ? "read" : "write",
      data,
    };
    onAnalyze({ protocol: "i2c", body });
  }, [
    active,
    i2cAddr,
    i2cBytes,
    i2cRead,
    onAnalyze,
    spiFreq,
    spiHex,
    spiMode,
    spiMsb,
    uartHex,
    uartParity,
    uartStops2,
  ]);

  const tabBtn = (id: ProtocolTab, label: string, icon: ReactNode) => (
    <button
      type="button"
      key={id}
      onClick={() => onActiveChange(id)}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
        active === id
          ? "bg-accent2/15 text-accent2 ring-1 ring-accent2/40"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Protocol</div>
      <nav className="flex flex-col gap-1">
        {tabBtn("uart", "UART", <Cable className="h-4 w-4" />)}
        {tabBtn("spi", "SPI", <Cpu className="h-4 w-4" />)}
        {tabBtn("i2c", "I2C", <Binary className="h-4 w-4" />)}
      </nav>

      <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-4 shadow-inner shadow-black/40">
        {active === "uart" && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-400">
              Data byte (hex)
              <input
                value={uartHex}
                onChange={(e) => setUartHex(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/10 bg-panel px-3 py-2 font-mono text-sm text-accent outline-none ring-accent2/30 focus:ring-2"
                placeholder="A5"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Parity
              <select
                value={uartParity}
                onChange={(e) => setUartParity(e.target.value as Parity)}
                className="mt-1 w-full rounded-md border border-white/10 bg-panel px-3 py-2 text-sm outline-none ring-accent2/30 focus:ring-2"
              >
                <option value="none">none</option>
                <option value="even">even</option>
                <option value="odd">odd</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={uartStops2}
                onChange={(e) => setUartStops2(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-panel text-accent2 focus:ring-accent2"
              />
              Two stop bits
            </label>
          </div>
        )}

        {active === "spi" && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-400">
              Data byte (hex)
              <input
                value={spiHex}
                onChange={(e) => setSpiHex(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/10 bg-panel px-3 py-2 font-mono text-sm text-accent outline-none ring-accent2/30 focus:ring-2"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Mode (0–3)
              <select
                value={spiMode}
                onChange={(e) => setSpiMode(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-white/10 bg-panel px-3 py-2 text-sm outline-none ring-accent2/30 focus:ring-2"
              >
                <option value={0}>Mode 0 (CPOL=0, CPHA=0)</option>
                <option value={1}>Mode 1 (CPOL=0, CPHA=1)</option>
                <option value={2}>Mode 2 (CPOL=1, CPHA=0)</option>
                <option value={3}>Mode 3 (CPOL=1, CPHA=1)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={spiMsb}
                onChange={(e) => setSpiMsb(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-panel text-accent2 focus:ring-accent2"
              />
              MSB first (off = LSB first)
            </label>
            <label className="block text-xs text-slate-400">
              Frequency: {(spiFreq / 1_000_000).toFixed(spiFreq >= 1_000_000 ? 2 : 3)} MHz
              <input
                type="range"
                min={100_000}
                max={10_000_000}
                step={50_000}
                value={spiFreq}
                onChange={(e) => setSpiFreq(Number(e.target.value))}
                className="mt-2 w-full accent-accent2"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                <span>100 kHz</span>
                <span>10 MHz</span>
              </div>
            </label>
          </div>
        )}

        {active === "i2c" && (
          <div className="space-y-3">
            <label className="block text-xs text-slate-400">
              7-bit address (hex)
              <input
                value={i2cAddr}
                onChange={(e) => setI2cAddr(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/10 bg-panel px-3 py-2 font-mono text-sm text-accent2 outline-none ring-accent2/30 focus:ring-2"
                placeholder="48"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={i2cRead}
                onChange={(e) => setI2cRead(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-panel text-accent2 focus:ring-accent2"
              />
              Read transaction
            </label>
            <div className="text-xs text-slate-400">Payload bytes (hex)</div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {i2cBytes.map((b, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={b}
                    onChange={(e) => {
                      const next = [...i2cBytes];
                      next[idx] = e.target.value;
                      setI2cBytes(next);
                    }}
                    className="flex-1 rounded-md border border-white/10 bg-panel px-2 py-1.5 font-mono text-xs outline-none ring-accent2/30 focus:ring-2"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => setI2cBytes((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove byte"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/15 py-2 text-xs text-slate-300 hover:border-accent2/50 hover:text-accent2"
              onClick={() => setI2cBytes((p) => (p.length >= 32 ? p : [...p, "00"]))}
            >
              <Plus className="h-4 w-4" />
              Add byte
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent2 px-4 py-3 text-sm font-semibold text-panel shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Activity className="h-4 w-4" />
        {loading ? "Analyzing…" : "Analyze frame"}
      </button>
    </div>
  );
}
