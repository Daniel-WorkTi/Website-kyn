$ErrorActionPreference = "Stop"
$toolsDir = Join-Path $PSScriptRoot ".tools"
$nodeDir = Join-Path $toolsDir "node"
$zip = Join-Path $toolsDir "node.zip"
$url = "https://nodejs.org/dist/v22.23.1/node-v22.23.1-win-x64.zip"

New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null

Write-Host "A transferir Node.js..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host "A extrair..." -ForegroundColor Cyan
Expand-Archive -Path $zip -DestinationPath $toolsDir -Force
Copy-Item "$toolsDir\node-v22.23.1-win-x64\*" $nodeDir -Recurse -Force

Remove-Item $zip -Force -ErrorAction SilentlyContinue
Write-Host "Node.js instalado em .tools\node" -ForegroundColor Green
