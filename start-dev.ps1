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
function Stop-ListenerOnPort {
  param([int]$Port)

  $pids = [System.Collections.Generic.HashSet[int]]::new()
  try {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object { [void]$pids.Add($_.OwningProcess) }
  } catch {
    # ignore
  }

  if ($pids.Count -eq 0) {
    netstat -ano | Select-String ":$Port\s" | ForEach-Object {
      if ($_ -match "LISTENING\s+(\d+)\s*$") {
        [void]$pids.Add([int]$Matches[1])
      }
    }
  }

  foreach ($procId in $pids) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if (-not $proc) { continue }
    Write-Host "A encerrar $($proc.ProcessName) na porta $Port (PID $procId)..." -ForegroundColor Yellow
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }

  if ($pids.Count -gt 0) {
    Start-Sleep -Seconds 2
  }
}

Stop-ListenerOnPort -Port 3000

if (Test-Path ".next") {
  Write-Host "A limpar cache de compilacao (.next)..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force ".next"
}

Write-Host ""
Write-Host "Servidor em http://localhost:3000" -ForegroundColor Green
Write-Host "Admin em    http://localhost:3000/admin" -ForegroundColor Green
Write-Host "Producao    https://website-kyn.vercel.app" -ForegroundColor Cyan
Write-Host ""
npm run dev
