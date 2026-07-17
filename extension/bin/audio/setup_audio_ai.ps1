$ErrorActionPreference = "Stop"

Write-Host "Keshav Velo Audio AI setup"
Write-Host "Installing Python 3.11 dependencies for local vocal separation..."

$python = "py"
try {
    & $python -3.11 --version | Out-Host
} catch {
    Write-Host "Python 3.11 was not found. Installing via winget..."
    winget install -e --id Python.Python.3.11 --scope user --accept-package-agreements --accept-source-agreements
}

& py -3.11 -m pip install --upgrade pip
& py -3.11 -m pip install -r "$PSScriptRoot\requirements.txt"

$modelPath = Join-Path $PSScriptRoot "models\vocalseperate_fp32.onnx"
if (-not (Test-Path $modelPath)) {
    Write-Host ""
    Write-Host "Local ONNX vocal model is not bundled yet:"
    Write-Host $modelPath
    Write-Host "Place your licensed vocal-separation ONNX model there, or the extension will use Demucs fallback."
}

Write-Host ""
Write-Host "Audio AI setup complete."
