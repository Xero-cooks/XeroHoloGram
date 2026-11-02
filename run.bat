@echo off
title XeroHoloGram Launcher
setlocal enabledelayedexpansion

echo ====================================================================
echo   ◈ XEROHOLOGRAM — 1-CLICK LAUNCHER
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
        where py >nul 2>nul
        if !errorlevel! equ 0 (
            set "PY_CMD=py"
        ) else (
            echo [ERROR] Python not found in PATH!
            echo Please install Python 3.10+ from python.org or Microsoft Store.
            pause
            exit /b 1
        )
    )
)

cd /d "%~dp0"
"!PY_CMD!" start.py

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Launcher stopped unexpectedly.
    pause
)
