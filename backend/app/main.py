import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("XeroHoloGramDaemon")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing XeroHoloGram Ultrafast Async Daemon...")
    yield
    logger.info("Shutting down XeroHoloGram Daemon.")


app = FastAPI(
    title="XeroHoloGram Daemon",
    description="Ultra-low-latency Async Multiplexer Daemon for 3D Holographic AI Agents",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "XeroHoloGram", "version": "1.0.0"}


@app.get("/api/status")
async def get_system_status():
    from backend.app.multiplexer import llm_client, d3_engine, connection_manager
    return {
        "status": "online",
        "service": "XeroHoloGram Hologram Daemon",
        "active_sessions": len(connection_manager.active_connections),
        "llm_model": getattr(llm_client, "model", "gpt-4o-mini"),
        "llm_base_url": getattr(llm_client, "base_url", "https://api.openai.com/v1"),
        "d3_engine": "active_so3"
    }


# Register WebSocket and Multiplexer routes
import backend.app.multiplexer  # noqa: F401, E402
