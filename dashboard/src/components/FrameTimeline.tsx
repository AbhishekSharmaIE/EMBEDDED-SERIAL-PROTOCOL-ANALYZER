import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyzeResult, I2cFrameResponse, SpiFrameResponse, UartFrameResponse } from "../api/client";

import type { ProtocolTab } from "./ProtocolSelector";

function uartLabel(i: number, r: UartFrameResponse): string {
  if (i === 0) return "START";
  if (i >= 1 && i <= 8) return `D${i - 1}`;
  const hasParity = r.parity_bit !== null;
  if (hasParity && i === 9) return "PAR";
  const firstStop = hasParity ? 10 : 9;
  if (i === firstStop) return "STOP1";
  if (i === firstStop + 1) return "STOP2";
  return `b${i}`;
}

function UartTimeline({ r }: { r: UartFrameResponse }) {
  const data = r.bits.map((bit, i) => ({
    name: uartLabel(i, r),
    bit,
    idx: i,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" domain={[0, 1]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={56}
          tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "ui-monospace" }}
          interval={0}
        />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelStyle={{ color: "#e2e8f0" }}
          formatter={(value: number) => (value !== 0 ? "HIGH (1)" : "LOW (0)")}
        />
        <Bar dataKey="bit" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell
              key={entry.idx}
              fill={
                entry.name === "START"
                  ? "#00d4ff"
                  : entry.name.startsWith("D")
                    ? "#00ff88"
                    : entry.name.startsWith("PAR")
                      ? "#fbbf24"
                      : "#38bdf8"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SpiRow({ title, values }: { title: string; values: number[] }) {
  const data = values.map((bit, i) => ({ name: `b${i}`, bit, i }));
  return (
    <div className="mb-3">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">{title}</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap={1}>
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(v: number) => (v !== 0 ? "1" : "0")}
          />
          <Bar dataKey="bit" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.i} fill={d.bit !== 0 ? "#00ff88" : "#0b2a22"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpiTimeline({ r }: { r: SpiFrameResponse }) {
  const cpol = r.mode >= 2 ? 1 : 0;
  const clk = Array.from({ length: 8 }, (_, i) => (((i + cpol) & 1) !== 0 ? 1 : 0));
  const mosi = r.mosi_bits.slice(0, 8);
  const cs = Array.from({ length: 8 }, () => (r.cs_active_low !== 0 ? 0 : 1));

  return (
    <div>
      <SpiRow title="CLK (symbolic per-bit)" values={clk} />
      <SpiRow title="MOSI" values={mosi} />
      <SpiRow title="CS (active-low asserted)" values={cs} />
      <p className="mt-2 font-mono text-[10px] text-slate-500">
        Edge timestamps (ns): first {Math.min(6, r.clock_edges_ns.length)} ={" "}
        {r.clock_edges_ns.slice(0, 6).join(", ")}
        …
      </p>
    </div>
  );
}

function I2cTimeline({ r }: { r: I2cFrameResponse }) {
  const rows: { name: string; v: number }[] = [
    { name: "START", v: 1 },
    { name: "ADDR", v: 1 },
    { name: "R/W", v: 1 },
    { name: "ACK", v: 1 },
  ];
  for (let i = 0; i < r.data_len; i++) {
    rows.push({ name: `DATA${i}`, v: 1 });
  }
  rows.push({ name: "STOP", v: 1 });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }} barCategoryGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" domain={[0, 1]} hide />
        <YAxis type="category" dataKey="name" width={64} tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "ui-monospace" }} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          formatter={() => "segment"}
        />
        <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {rows.map((row, idx) => (
            <Cell
              key={row.name + idx}
              fill={
                row.name === "START" || row.name === "STOP"
                  ? "#00d4ff"
                  : row.name === "ACK"
                    ? "#fbbf24"
                    : "#a78bfa"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface Props {
  protocol: ProtocolTab;
  result: AnalyzeResult | null;
  animKey: number;
}

export function FrameTimeline({ protocol, result, animKey }: Props) {
  if (!result) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-sm text-slate-500">
        Run <span className="mx-1 font-mono text-accent2">Analyze frame</span> to render the timeline.
      </div>
    );
  }

  return (
    <div key={animKey} className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 shadow-inner shadow-black/50 md:p-4">
      <div className="origin-left animate-draw" style={{ transformOrigin: "left center" }}>
        {protocol === "uart" && result.protocol === "uart" && <UartTimeline r={result} />}
        {protocol === "spi" && result.protocol === "spi" && <SpiTimeline r={result} />}
        {protocol === "i2c" && result.protocol === "i2c" && <I2cTimeline r={result} />}
      </div>
    </div>
  );
}
