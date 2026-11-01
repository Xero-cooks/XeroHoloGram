#!/usr/bin/env bash
set -e

echo "=================================================="
echo "     Launching XeroHoloGram Holographic Harness   "
echo "=================================================="

# 1. Start backend daemon
python3 -m uvicorn backend.app.multiplexer:app --host 0.0.0.0 --port 8765 &
BACKEND_PID=$!

# 2. Start frontend
cd frontend
bun run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
