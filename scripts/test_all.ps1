Write-Host "Running Frontend Unit & Integration Tests..." -ForegroundColor Cyan
bun test frontend/tests

Write-Host "`nRunning Backend Unit & Integration Tests..." -ForegroundColor Cyan
python -m pytest backend/tests -v
