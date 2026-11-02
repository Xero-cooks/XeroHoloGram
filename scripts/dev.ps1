# Launch XeroHoloGram Backend and Frontend
$ProjectRoot = Resolve-Path "$PSScriptRoot\.."
Set-Location $ProjectRoot

$py = "python"
if (Test-Path "C:\Python314\python.exe") {
    $py = "C:\Python314\python.exe"
}

& $py start.py
