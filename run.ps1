# ====================================================================
#   ◈ XEROHOLOGRAM — 1-CLICK POWERSHELL LAUNCHER
# ====================================================================

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

# Locate Python
$PythonExe = $null
if (Test-Path "C:\Python314\python.exe") {
    $PythonExe = "C:\Python314\python.exe"
} else {
    $found = Get-Command python -ErrorAction SilentlyContinue
    if ($found) {
        $PythonExe = $found.Source
    } else {
        $foundPy = Get-Command py -ErrorAction SilentlyContinue
        if ($foundPy) {
            $PythonExe = $foundPy.Source
        }
    }
}

if (-not $PythonExe) {
    Write-Host "[ERROR] Python 3.10+ not found in PATH or at C:\Python314\python.exe" -ForegroundColor Red
    exit 1
}

& $PythonExe start.py
