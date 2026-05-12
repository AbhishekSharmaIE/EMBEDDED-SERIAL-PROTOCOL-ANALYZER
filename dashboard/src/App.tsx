import { useCallback, useState } from "react";

import {
  postI2cFrame,
  postSpiFrame,
  postUartFrame,
  type AnalyzeResult,
} from "./api/client";
import { ByteBreakdown } from "./components/ByteBreakdown";
import { FrameTimeline } from "./components/FrameTimeline";
import { MisraPanel } from "./components/MisraPanel";
import { ProtocolSelector, type AnalyzePayload, type ProtocolTab } from "./components/ProtocolSelector";

function Skeleton() {
  return (
    <div className="animate-shimmer space-y-3 rounded-xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] p-4">
      <div className="h-4 w-1/3 rounded bg-slate-700/60" />
      <div className="h-40 rounded-lg bg-slate-800/60" />
      <div className="h-24 rounded-lg bg-slate-800/60" />
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<ProtocolTab>("uart");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnalyze = useCallback(async (payload: AnalyzePayload) => {
    setLoading(true);
    setError(null);
    try {
      let data: AnalyzeResult;
      if (payload.protocol === "uart") {
        data = await postUartFrame(payload.body);
      } else if (payload.protocol === "spi") {
        data = await postSpiFrame(payload.body);
      } else {
        data = await postI2cFrame(payload.body);
      }
      setResult(data);
      setAnimKey((k) => k + 1);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-panel md:flex-row">
      <aside className="w-full border-b border-white/10 bg-black/40 md:w-72 md:border-b-0 md:border-r md:border-white/10">
        <ProtocolSelector
          active={tab}
          onActiveChange={(t) => {
            setTab(t);
            setResult(null);
            setError(null);
          }}
          onAnalyze={onAnalyze}
          loading={loading}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-black/40 via-panel to-black/40 px-4 py-4 md:px-8">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">
              Serial Protocol Analyzer
              <span className="ml-1 inline-block h-5 w-2 translate-y-0.5 animate-blink bg-accent2 align-middle" aria-hidden />
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-400 md:text-sm">
              Oscilloscope-style visualization for UART, SPI, and I2C frames simulated in MISRA-aware firmware.
            </p>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl shadow-black/40 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Visualization</h2>
              {result && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent">
                  {result.protocol.toUpperCase()}
                </span>
              )}
            </div>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}
            {loading ? (
              <Skeleton />
            ) : (
              <FrameTimeline protocol={tab} result={result} animKey={animKey} />
            )}
          </section>

          <section>{loading ? <Skeleton /> : <ByteBreakdown protocol={tab} result={result} />}</section>

          <MisraPanel />
        </main>
      </div>
    </div>
  );
}
