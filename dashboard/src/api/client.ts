function resolvedApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (raw !== undefined && raw !== null) {
    const s = String(raw).trim();
    if (s.length > 0) {
      if (s === "relative") {
        return "";
      }
      return s.replace(/\/$/, "");
    }
  }
  return import.meta.env.DEV ? "" : "http://localhost:8000";
}

const API_BASE: string = resolvedApiBase();

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE === "") return p;
  return `${String(API_BASE).replace(/\/$/, "")}${p}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  try {
    return await fetch(url, init);
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach the API (network error). Start the bridge on port 8000, e.g. " +
          "`cd bridge && . .venv/bin/activate && python -m uvicorn api:app --host 127.0.0.1 --port 8000`. " +
          "With `npm run dev`, requests use a Vite proxy to 127.0.0.1:8000.",
      );
    }
    throw e;
  }
}

export type Parity = "none" | "even" | "odd";

export interface UartFrameRequest {
  data: number;
  parity: Parity;
  stop_bits: 1 | 2;
}

export interface UartFrameResponse {
  protocol: "uart";
  data: number;
  valid: boolean;
  bit_count: number;
  bits: number[];
  parity_bit: number | null;
}

export interface SpiFrameRequest {
  data: number;
  mode: number;
  bit_order: "msb" | "lsb";
  freq_hz: number;
}

export interface SpiFrameResponse {
  protocol: "spi";
  data: number;
  mode: number;
  cs_active_low: number;
  bit_order: "msb" | "lsb";
  clock_edges_ns: number[];
  mosi_bits: number[];
}

export interface I2cFrameRequest {
  address: number;
  rw: "read" | "write";
  data: number[];
}

export interface I2cFrameResponse {
  protocol: "i2c";
  address: number;
  rw: "read" | "write";
  ack_received: boolean;
  data_len: number;
  data: number[];
  error_code: number;
}

export type AnalyzeResult = UartFrameResponse | SpiFrameResponse | I2cFrameResponse;

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    if (j.detail != null) return JSON.stringify(j.detail);
    return text.length > 0 ? text : res.statusText;
  } catch {
    if (res.status === 404 && text.includes("NOT_FOUND")) {
      return (
        "API returned 404 (edge NOT_FOUND). On Vercel: clear Project → Settings → Build & Development → " +
        "Output Directory (must be empty), clear Install Command override, redeploy latest main so POST /api/* reaches FastAPI."
      );
    }
    return text.length > 0 ? text : res.statusText;
  }
}

export async function postUartFrame(body: UartFrameRequest): Promise<UartFrameResponse> {
  const res = await apiFetch("/api/uart/frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<UartFrameResponse>;
}

export async function postSpiFrame(body: SpiFrameRequest): Promise<SpiFrameResponse> {
  const res = await apiFetch("/api/spi/frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SpiFrameResponse>;
}

export async function postI2cFrame(body: I2cFrameRequest): Promise<I2cFrameResponse> {
  const res = await apiFetch("/api/i2c/frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<I2cFrameResponse>;
}

export async function getProtocols(): Promise<{ id: string; name: string; description: string }[]> {
  const res = await apiFetch("/api/protocols");
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
