import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config_store import config_store

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


@app.get("/api/config")
async def get_config():
    """Retrieve persisted LLM, Decision, and TTS configuration from disk."""
    return {"status": "ok", "config": config_store.get()}


@app.post("/api/config")
async def save_config(request: Request):
    """Save updated LLM, Decision, and TTS configuration directly to local disk."""
    data = await request.json()
    updated = config_store.save(data)
    
    # Synchronize active in-memory singletons
    try:
        from backend.app.multiplexer import sync_runtime_config
        sync_runtime_config(updated)
    except Exception as e:
        logger.warning(f"Could not immediately sync runtime config: {e}")

    return {"status": "ok", "saved_to_disk": True, "config": updated}


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
