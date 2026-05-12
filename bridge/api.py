"""FastAPI bridge — scaffold; protocol endpoints added in later steps."""

from fastapi import FastAPI

app = FastAPI(
    title="Embedded Serial Protocol Analyzer",
    description="Bridge between C firmware and the React dashboard.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
