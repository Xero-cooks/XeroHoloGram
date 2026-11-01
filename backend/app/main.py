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
