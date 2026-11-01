#!/usr/bin/env bash
# ====================================================================
#   ◈ XEROHOLOGRAM / AGENTIC-HOLOGRAM — STARTUP HARNESS (UNIX / LINUX / MACOS)
#   ◈ Dual-Stream Holographic AI Agent & Pepper's Ghost Engine
# ====================================================================

set -e

echo "===================================================================="
echo "  ◈ XEROHOLOGRAM / AGENTIC-HOLOGRAM — STARTUP HARNESS"
echo "  ◈ Dual-Stream Holographic AI Agent & Pepper's Ghost Engine"
echo "===================================================================="

# Check Python
if command -v python3 &> /dev/null; then
    PY_CMD="python3"
elif command -v python &> /dev/null; then
    PY_CMD="python"
else
    echo "[ERROR] Python 3.10+ is required but not found."
    exit 1
fi

# Check Bun or NPM
if command -v bun &> /dev/null; then
    PKG_CMD="bun"
elif command -v npm &> /dev/null; then
    PKG_CMD="npm"
else
    echo "[ERROR] Neither bun nor npm found. Please install Bun or Node.js."
    exit 1
fi

echo "[INFO] Using Python: $($PY_CMD --version)"
echo "[INFO] Using Package Manager: $PKG_CMD"

# Handle Ctrl+C cleanup
cleanup() {
    echo ""
    echo "[SYS] Terminating holographic daemons..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend Daemon
echo "[SYS] Starting Backend Multiplexer on ws://localhost:8765/ws/hologram ..."
$PY_CMD -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8765 --reload &

# Start Frontend Dev Server
echo "[SYS] Starting Hologram WebGL Viewport on http://localhost:5173 ..."
if [ "$PKG_CMD" = "bun" ]; then
    bun run --cwd frontend dev &
else
    npm --prefix frontend run dev &
fi

echo ""
echo "===================================================================="
echo "  ◈ HOLOGRAM HARNESS RUNNING"
echo "  - Backend:  ws://localhost:8765/ws/hologram"
echo "  - Frontend: http://localhost:5173"
echo "  Press Ctrl+C to terminate all processes."
echo "===================================================================="

wait
