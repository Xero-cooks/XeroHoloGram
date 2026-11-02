@echo off
title XeroHoloGram Launcher
setlocal enabledelayedexpansion

cd /d "%~dp0"

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
            pause
            exit /b 1
        )
    )
)

"!PY_CMD!" start.py
