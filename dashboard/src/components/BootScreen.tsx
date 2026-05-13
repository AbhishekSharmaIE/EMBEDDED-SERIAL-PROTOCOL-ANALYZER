/** Full-screen oscilloscope-style boot splash (shown once at startup). */
export function BootScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-panel">
      <p className="mb-8 font-mono text-sm tracking-wide text-accent2">Initializing Protocol Analyzer…</p>
      <div className="relative h-24 w-full max-w-lg overflow-hidden rounded border border-accent/30 bg-black/60 shadow-[0_0_40px_rgba(0,255,136,0.15)]">
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-accent to-transparent opacity-90 animate-sweepline" />
        <div className="absolute bottom-2 left-3 font-mono text-[10px] text-slate-500">CH1 · TIME BASE</div>
      </div>
    </div>
  );
}
