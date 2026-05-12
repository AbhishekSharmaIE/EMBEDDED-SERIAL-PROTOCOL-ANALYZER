import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { useState } from "react";

const RULES: { id: string; title: string; hint: string }[] = [
  {
    id: "R1.3",
    title: "Rule 1.3 — No undefined behaviour",
    hint: "Array indices and pointers stay in bounds so timing and decoding never read garbage memory.",
  },
  {
    id: "R14.4",
    title: "Rule 14.4 — Boolean conditions",
    hint: "Conditionals use explicit comparisons, which keeps intent obvious in safety reviews.",
  },
  {
    id: "R15.5",
    title: "Rule 15.5 — Single exit point",
    hint: "Each function returns through one path, which simplifies traceability and static review.",
  },
  {
    id: "R17.3",
    title: "Rule 17.3 — No implicit declarations",
    hint: "Headers declare APIs explicitly so the compiler can catch mismatches early.",
  },
  {
    id: "R17.7",
    title: "Rule 17.7 — Use return values",
    hint: "Ignored results are a common defect class; return values are handled deliberately.",
  },
  {
    id: "R18.1",
    title: "Rule 18.1 — Pointer arithmetic bounds",
    hint: "SPI clock edge tables are indexed with fixed upper limits to avoid out-of-range access.",
  },
  {
    id: "R21.6",
    title: "Rule 21.6 — stdio usage controlled",
    hint: "Print helpers are gated behind DEBUG so production paths stay free of formatted I/O.",
  },
];

export function MisraPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-100 md:px-5"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          MISRA C:2012 rules applied in this simulation
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-white/10 px-4 pb-4 pt-2 md:px-5">
          <p className="text-xs text-slate-400">
            ASPICE: <span className="font-semibold text-accent2">SWE.3 Software Detailed Design</span> — unit verified
            (firmware tests + CI).
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {RULES.map((r) => (
              <li
                key={r.id}
                className="flex cursor-help items-start gap-2 rounded-lg border border-white/5 bg-panel/60 px-3 py-2"
                title={r.hint}
              >
                <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 accent-accent" aria-hidden />
                <div>
                  <div className="font-mono text-[11px] font-semibold text-accent">{r.id}</div>
                  <div className="text-xs text-slate-200">{r.title}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
