@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   ◈ XEROHOLOGRAM / AGENTIC-HOLOGRAM — STARTUP HARNESS
echo   ◈ Dual-Stream Holographic AI Agent & Pepper's Ghost Engine
echo ====================================================================

:: Find Python
set "PY_CMD="
if exist "C:\Python314\python.exe" (
    set "PY_CMD=C:\Python314\python.exe"
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PY_CMD=python"
    ) else (
        echo [ERROR] Python not found. Please install Python 3.10+ and add it to PATH.
        pause
        exit /b 1
    )
)

:: Find Bun or Node
set "PKG_RUN="
where bun >nul 2>nul
if !errorlevel! equ 0 (
    set "PKG_RUN=bun"
) else (
    where npm >nul 2>nul
    if !errorlevel! equ 0 (
        set "PKG_RUN=npm"
    ) else (
        echo [ERROR] Neither Bun nor NPM was found. Please install Bun or Node.js.
        pause
        exit /b 1
    )
)

echo [INFO] Using Python runtime: !PY_CMD!
echo [INFO] Using Package Manager: !PKG_RUN!
echo.

:: Launch Backend Multiplexer
echo [SYS] Starting Backend Multiplexer Daemon on ws://localhost:8765/ws/hologram ...
start "XeroHoloGram Backend" cmd /k "!PY_CMD! -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8765 --reload"

:: Launch Frontend Viewport
echo [SYS] Starting Hologram WebGL Viewport on http://localhost:5173 ...
if "!PKG_RUN!"=="bun" (
    start "XeroHoloGram Frontend" cmd /k "bun run --cwd frontend dev"
) else (
    start "XeroHoloGram Frontend" cmd /k "npm --prefix frontend run dev"
)

echo.
echo ====================================================================
echo   ◈ HOLOGRAM HARNESS RUNNING
echo   - Backend:  ws://localhost:8765/ws/hologram
echo   - Frontend: http://localhost:5173
echo   Press any key to close this launcher window (services keep running)...
echo ====================================================================
pause >nul
