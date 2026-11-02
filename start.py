"""
start.py
====================================================================
  XEROHOLOGRAM / AGENTIC-HOLOGRAM — UNIFIED ONE-CLICK LAUNCHER
  Boots Backend Multiplexer Daemon (Port 8765) + Frontend WebGL Viewport (Port 5173)
  Auto-detects runtimes, frees conflicting ports, and opens browser.
====================================================================
"""

import os
import sys
import time
import socket
import shutil
import signal
import subprocess
import webbrowser
from typing import Optional, List

BACKEND_PORT = 8765
FRONTEND_PORT = 5173
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")


def print_banner():
    banner = f"""
\033[36m====================================================================
  ◈ XEROHOLOGRAM / AGENTIC-HOLOGRAM — STARTUP HARNESS
  ◈ Dual-Stream Holographic AI Agent & Pepper's Ghost Optical Stage
====================================================================\033[0m
  \033[32m✔ Project Root:\033[0m  {PROJECT_ROOT}
  \033[32m✔ Backend WS:\033[0m    ws://localhost:{BACKEND_PORT}/ws/hologram
  \033[32m✔ Frontend UI:\033[0m   http://localhost:{FRONTEND_PORT}
====================================================================
"""
    print(banner)


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def kill_process_on_port(port: int):
    """Frees a port on Windows/POSIX if already occupied by a previous session."""
    if not is_port_in_use(port):
        return

    print(f"\033[33m[SYS] Port {port} is occupied. Terminating dangling process...\033[0m")
    if sys.platform == "win32":
        try:
            cmd = f'powershell -Command "Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"'
            subprocess.run(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(1.0)
        except Exception:
            pass
    else:
        try:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(0.5)
        except Exception:
            pass


def get_python_executable() -> str:
    # Check current interpreter
    if sys.executable and os.path.exists(sys.executable):
        return sys.executable
    if sys.platform == "win32" and os.path.exists(r"C:\Python314\python.exe"):
        return r"C:\Python314\python.exe"
    return "python"


def get_frontend_cmd() -> List[str]:
    # Check Bun first
    if shutil.which("bun"):
        return ["bun", "run", "dev"]
    # Fallback to NPM / NPX
    if shutil.which("npm"):
        return ["npm", "run", "dev"]
    print("\033[31m[ERROR] Neither 'bun' nor 'npm' found in PATH! Please install Bun or Node.js.\033[0m")
    sys.exit(1)


def wait_for_backend(timeout: float = 12.0) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_in_use(BACKEND_PORT):
            return True
        time.sleep(0.3)
    return False


def wait_for_frontend(timeout: float = 12.0) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_in_use(FRONTEND_PORT):
            return True
        time.sleep(0.3)
    return False


def main():
    print_banner()

    py_exe = get_python_executable()
    frontend_cmd = get_frontend_cmd()

    print(f"[INFO] Using Python: {py_exe}")
    print(f"[INFO] Using Frontend Runner: {' '.join(frontend_cmd)}")

    # Clean up stale ports from previous runs
    kill_process_on_port(BACKEND_PORT)
    kill_process_on_port(FRONTEND_PORT)

    processes: List[subprocess.Popen] = []

    def cleanup(signum=None, frame=None):
        print("\n\033[33m[SYS] Gracefully shutting down XeroHoloGram...\033[0m")
        for p in processes:
            try:
                if sys.platform == "win32":
                    subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
        print("\033[32m[SYS] All services stopped. Goodbye!\033[0m")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        # 1. Start Backend Multiplexer Daemon
        print(f"\n\033[36m[1/2] Launching Backend Daemon on ws://localhost:{BACKEND_PORT}...\033[0m")
        backend_args = [
            py_exe, "-m", "uvicorn", "backend.app.main:app",
            "--host", "0.0.0.0",
            "--port", str(BACKEND_PORT),
            "--reload"
        ]
        p_backend = subprocess.Popen(
            backend_args,
            cwd=PROJECT_ROOT,
            env=os.environ.copy()
        )
        processes.append(p_backend)

        # Wait for backend to bind port
        if wait_for_backend(timeout=10.0):
            print(f"\033[32m✔ Backend online and ready at ws://localhost:{BACKEND_PORT}/ws/hologram\033[0m")
        else:
            print("\033[33m[WARN] Backend taking longer than usual to bind port 8765...\033[0m")

        # 2. Start Frontend Vite Server
        print(f"\n\033[36m[2/2] Launching 3D Holographic Frontend on http://localhost:{FRONTEND_PORT}...\033[0m")
        p_frontend = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            env=os.environ.copy()
        )
        processes.append(p_frontend)

        # Wait for frontend to be ready
        if wait_for_frontend(timeout=10.0):
            print(f"\033[32m✔ Frontend online at http://localhost:{FRONTEND_PORT}\033[0m")
        
        # 3. Open browser automatically
        time.sleep(1.0)
        frontend_url = f"http://localhost:{FRONTEND_PORT}"
        print(f"\n\033[35m[BROWSER] Launching {frontend_url} in default browser...\033[0m")
        webbrowser.open(frontend_url)

        print("\n\033[32m====================================================================")
        print("  ◈ XEROHOLOGRAM IS LIVE AND STREAMING!")
        print(f"  ◈ Open: {frontend_url}")
        print("  ◈ Press Ctrl+C at any time to shut down both servers cleanly.")
        print("====================================================================\033[0m\n")

        # Keep parent process alive monitoring children
        while True:
            time.sleep(1.0)
            for p in processes:
                if p.poll() is not None:
                    print(f"\033[31m[WARN] Process {p.args} exited with code {p.returncode}\033[0m")
                    cleanup()

    except KeyboardInterrupt:
        cleanup()
    except Exception as e:
        print(f"\033[31m[ERROR] Failed to run: {e}\033[0m")
        cleanup()


if __name__ == "__main__":
    main()
