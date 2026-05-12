import { useMemo, useState } from "react";

import type { AnalyzeResult } from "../api/client";

import type { ProtocolTab } from "./ProtocolSelector";

interface Props {
  protocol: ProtocolTab;
  result: AnalyzeResult | null;
}

function asciiChar(b: number): string {
  if (b >= 32 && b <= 126) return String.fromCharCode(b);
  return "·";
}

export function ByteBreakdown({ protocol, result }: Props) {
  const [activeBit, setActiveBit] = useState<number | null>(null);

  const { byte, caption, controlMask } = useMemo(() => {
    if (!result) {
      return { byte: 0, caption: "Payload byte", controlMask: 0 };
    }
    if (result.protocol === "i2c") {
      const rwb = result.rw === "read" ? 1 : 0;
      const wire = ((result.address & 0x7f) << 1) | rwb;
      return {
        byte: wire & 0xff,
        caption: "Wire address byte (7-bit addr << 1 | R/W bit)",
        controlMask: 0x01,
      };
    }
    return { byte: result.data & 0xff, caption: "UART / SPI data byte (payload)", controlMask: 0 };
  }, [result]);

  const bits = useMemo(() => Array.from({ length: 8 }, (_, i) => ((byte >> (7 - i)) & 1) === 1), [byte]);

  if (!result) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        Byte breakdown appears after a successful analysis.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 md:p-5">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Byte breakdown</div>
          <div className="mt-1 text-sm text-slate-300">{caption}</div>
        </div>
        <div className="font-mono text-xs text-slate-400">
          <span className="text-accent2">0x{byte.toString(16).toUpperCase().padStart(2, "0")}</span>
          <span className="mx-2 text-slate-600">|</span>
          <span>{byte}</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="text-accent">{asciiChar(byte)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {bits.map((high, i) => {
          const bitIndex = 7 - i;
          const isControl = protocol === "i2c" && ((controlMask >> bitIndex) & 1) === 1;
          const selected = activeBit === bitIndex;
          return (
            <button
              type="button"
              key={bitIndex}
              onClick={() => setActiveBit(bitIndex)}
              className={`group relative flex h-14 w-14 flex-col items-center justify-center rounded-md border font-mono text-xs transition ${
                selected
                  ? "border-accent2 bg-accent2/10 text-accent2 shadow-[0_0_20px_rgba(0,212,255,0.25)]"
                  : isControl
                    ? "border-accent2/40 bg-accent2/5 text-slate-100 hover:border-accent2 hover:text-accent2"
                    : "border-white/10 bg-panel text-slate-200 hover:border-accent/60 hover:text-accent"
              }`}
              title={`Bit ${bitIndex}`}
            >
              <span className="text-[10px] text-slate-500 group-hover:text-slate-300">b{bitIndex}</span>
              <span className="text-lg font-semibold">{high ? "1" : "0"}</span>
              <span className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[10px] text-slate-200 group-hover:block">
                {isControl ? "Control (R/W)" : "Payload"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-accent/80" /> Payload bits
        </span>
        {protocol === "i2c" && (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-accent2/80" /> Control (R/W)
          </span>
        )}
      </div>
    </div>
  );
}
