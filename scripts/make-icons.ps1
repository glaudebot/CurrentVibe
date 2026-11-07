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

# Star icon: see scripts/make-star.html (WebP source, rendered in a browser).

# Line icons (transparent PNG): crop, shrink to 128, thicken thin strokes by
# one pixel (copy the strongest neighbor), then shrink to 64.
function Make-LineIcon($name, $rect) {
  $src = [System.Drawing.Image]::FromFile("$root/assets/$name-source.png")
  $mid = New-Object System.Drawing.Bitmap 128, 128
  $g = [System.Drawing.Graphics]::FromImage($mid)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, 128, 128), $rect, 'Pixel')
  $g.Dispose(); $src.Dispose()
  $fat = New-Object System.Drawing.Bitmap 128, 128
  for ($x = 0; $x -lt 128; $x++) { for ($y = 0; $y -lt 128; $y++) {
    $best = $mid.GetPixel($x, $y)
    foreach ($d in @(@(-1,0),@(1,0),@(0,-1),@(0,1))) {
      $nx = $x + $d[0]; $ny = $y + $d[1]
      if ($nx -ge 0 -and $nx -lt 128 -and $ny -ge 0 -and $ny -lt 128) {
        $n = $mid.GetPixel($nx, $ny); if ($n.A -gt $best.A) { $best = $n }
      }
    }
    $fat.SetPixel($x, $y, $best)
  } }
  $out = New-Object System.Drawing.Bitmap 64, 64
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($fat, 0, 0, 64, 64)
  $out.Save("$root/icons/$name.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $out.Dispose(); $fat.Dispose(); $mid.Dispose()
}
Make-LineIcon 'link' (New-Object System.Drawing.Rectangle 232, 232, 560, 560)
Make-LineIcon 'copy' (New-Object System.Drawing.Rectangle 232, 240, 560, 560)
Write-Output "icons written"
