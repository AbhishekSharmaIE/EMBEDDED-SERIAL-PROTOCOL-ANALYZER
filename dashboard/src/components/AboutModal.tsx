import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-panel p-6 shadow-2xl shadow-black/50">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="about-title" className="text-lg font-semibold text-white">
            About this project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          <section>
            <h3 className="mb-1 font-semibold text-accent2">Protocols (one line each)</h3>
            <ul className="list-inside list-disc space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-200">UART</strong> — Asynchronous serial: a start bit, eight data bits, optional
                parity, then stop bit(s); common on debug consoles and many ECU links.
              </li>
              <li>
                <strong className="text-slate-200">SPI</strong> — Synchronous serial with a clock and chip-select: good for
                sensors, flash, and high-speed peripherals next to the MCU.
              </li>
              <li>
                <strong className="text-slate-200">I2C</strong> — Two-wire multi-drop bus: clock plus data, with addresses and
                ACK bits; used inside vehicles for compact sensor networks.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-accent2">MISRA C</h3>
            <p>
              MISRA C is a set of coding rules for C in safety-related systems. Following MISRA-style practice reduces
              undefined behaviour, surprises in control flow, and review load—things automotive teams care about next to
              ISO&nbsp;26262.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-accent2">ASPICE</h3>
            <p>
              Automotive SPICE (ASPICE) describes how suppliers engineer software: design, implementation, verification,
              and traceable evidence. Tier-1 suppliers often expect ASPICE-aligned artefacts linking code to tests and
              standards.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-accent2">Why it matters for embedded roles</h3>
            <p>
              This demo ties together <strong className="text-slate-200">protocol understanding</strong>,{" "}
              <strong className="text-slate-200">MISRA-aware C</strong>, <strong className="text-slate-200">traceability</strong>{" "}
              notes, a <strong className="text-slate-200">REST bridge</strong>, and a{" "}
              <strong className="text-slate-200">modern UI</strong>—the same ingredients you see in automotive software
              bring-up, tooling, and supplier reviews.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
