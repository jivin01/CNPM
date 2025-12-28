# PowerShell setup: create venv and install deps
if (-not (Test-Path -Path .venv)) {
    python -m venv .venv
}
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
Write-Host "Setup complete. Start server with: .venv\Scripts\Activate.ps1 ; uvicorn app.main:app --reload --port 8000"