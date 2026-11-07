# Builds dist/currentvibe-<version>.zip with only the files the extension needs.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content "$root/manifest.json" -Raw | ConvertFrom-Json).version
$stage = Join-Path ([IO.Path]::GetTempPath()) "currentvibe-pack"
$zip = "$root/dist/currentvibe-$version.zip"

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force "$stage/icons", "$root/dist" | Out-Null
Copy-Item "$root/manifest.json", "$root/sidebar.html", "$root/sidebar.css" $stage
Copy-Item "$root/src" $stage -Recurse
Copy-Item "$root/icons/*.png" "$stage/icons"
Remove-Item $zip -ErrorAction SilentlyContinue
# tar (bsdtar) writes forward-slash paths; PowerShell 5.1 Compress-Archive writes backslashes.
& "$env:SystemRoot\System32\tar.exe" -a -c -f $zip -C $stage manifest.json sidebar.html sidebar.css src icons
if ($LASTEXITCODE -ne 0) { throw "tar failed" }
Remove-Item $stage -Recurse -Force
Write-Output "packed $zip"
