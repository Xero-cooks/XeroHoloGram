# Launch XeroHoloGram Backend and Frontend
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "     Launching XeroHoloGram Holographic Harness    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start FastAPI Async Multiplexer Daemon in background
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn backend.app.multiplexer:app --host 0.0.0.0 --port 8765 --reload"

# 2. Start Three.js Frontend Vite Server
Set-Location frontend
bun run dev
