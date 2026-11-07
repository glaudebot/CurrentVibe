# Dev-only: crops assets/logo-source.jpg to a square around the logo and writes icons/icon{16,48,128}.png.
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$src = [System.Drawing.Image]::FromFile("$root/assets/logo-source.jpg")
$crop = New-Object System.Drawing.Rectangle 134, 80, 660, 660   # square centered on the heart
foreach ($s in 16, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $s, $s), $crop, 'Pixel')
  $bmp.Save("$root/icons/icon$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
$src.Dispose()
Write-Output "icons written"
