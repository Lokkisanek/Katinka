# Generates assets/photos/manifest.json containing all image filenames in that folder
# Run from the project root: PowerShell -NoProfile -ExecutionPolicy Bypass -File .\scripts\generate_photos_manifest.ps1
$photosPath = Join-Path $PSScriptRoot "..\assets\photos"
if (-Not (Test-Path $photosPath)) {
  Write-Error "Directory not found: $photosPath"
  exit 1
}
$files = Get-ChildItem -Path $photosPath -File -Include *.jpg, *.jpeg, *.png, *.gif, *.webp | Sort-Object Name | ForEach-Object { $_.Name }
$manifestPath = Join-Path $photosPath "manifest.json"
$files | ConvertTo-Json -Depth 1 | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Output "Wrote manifest with $($files.Count) files to $manifestPath"
