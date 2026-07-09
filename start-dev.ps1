$nodeDir = Join-Path $PSScriptRoot ".tools\node"
if (-not (Test-Path "$nodeDir\node.exe")) {
  $alt = Join-Path $PSScriptRoot ".tools\node-v22.23.1-win-x64"
  if (Test-Path "$alt\node.exe") { $nodeDir = $alt }
  else {
    Write-Host "Node.js local nao encontrado. A instalar..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup-node.ps1")
    $nodeDir = Join-Path $PSScriptRoot ".tools\node"
  }
}

$env:Path = "$nodeDir;" + $env:Path
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
  Write-Host "A instalar dependencias..." -ForegroundColor Cyan
  npm install
}

# Libertar porta 3000 se um servidor antigo ficou preso
foreach ($port in 3000) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -match "node") {
      Write-Host "A encerrar processo node na porta $port (PID $($proc.Id))..." -ForegroundColor Yellow
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
  }
}

Write-Host ""
Write-Host "Servidor em http://localhost:3000" -ForegroundColor Green
Write-Host "Admin em    http://localhost:3000/admin" -ForegroundColor Green
Write-Host "Producao    https://website-kyn.vercel.app" -ForegroundColor Cyan
Write-Host ""
npm run dev
