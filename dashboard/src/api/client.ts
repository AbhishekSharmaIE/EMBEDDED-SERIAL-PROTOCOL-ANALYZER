const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
  try {
    const j = (await res.json()) as { detail?: unknown };
    if (typeof j.detail === "string") return j.detail;
    return JSON.stringify(j.detail ?? j);
  } catch {
    return await res.text();
  }
}

export async function postUartFrame(body: UartFrameRequest): Promise<UartFrameResponse> {
  const res = await fetch(`${API_BASE}/api/uart/frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<UartFrameResponse>;
}

export async function postSpiFrame(body: SpiFrameRequest): Promise<SpiFrameResponse> {
  const res = await fetch(`${API_BASE}/api/spi/frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SpiFrameResponse>;
}

export async function postI2cFrame(body: I2cFrameRequest): Promise<I2cFrameResponse> {
  const res = await fetch(`${API_BASE}/api/i2c/frame`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<I2cFrameResponse>;
}

export async function getProtocols(): Promise<{ id: string; name: string; description: string }[]> {
  const res = await fetch(`${API_BASE}/api/protocols`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
