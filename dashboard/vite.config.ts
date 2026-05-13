import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function nodeEnv(): Record<string, string | undefined> {
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env ?? {};
}

/** GitHub project Pages needs a repo-scoped base (set in CI via `VITE_BASE`). */
const baseRaw = nodeEnv().VITE_BASE?.trim();
const base =
  baseRaw && baseRaw !== "/"
    ? baseRaw.endsWith("/")
      ? baseRaw
      : `${baseRaw}/`
    : "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
