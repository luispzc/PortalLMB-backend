# Descarga pocketbase.exe (Windows) en la raíz del proyecto.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\instalar-pocketbase.ps1

$ErrorActionPreference = "Stop"
$version = "0.30.0"
$raiz = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $raiz "pocketbase.zip"
$url = "https://github.com/pocketbase/pocketbase/releases/download/v$version/pocketbase_${version}_windows_amd64.zip"

Write-Host "Descargando PocketBase $version..."
Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $raiz -Force
Remove-Item $zip
Remove-Item (Join-Path $raiz "CHANGELOG.md"), (Join-Path $raiz "LICENSE.md") -ErrorAction SilentlyContinue

& (Join-Path $raiz "pocketbase.exe") --version
