# Genera iconos PNG para la extensión usando .NET System.Drawing
Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param([int]$size, [string]$outPath)

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $cx = $size / 2.0
    $cy = $size / 2.0
    $r = $size / 2.0 - 1

    # Fondo degradado oscuro
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.PointF]::new(0, 0),
        [System.Drawing.PointF]::new($size, $size),
        [System.Drawing.Color]::FromArgb(30, 64, 175),
        [System.Drawing.Color]::FromArgb(15, 23, 42)
    )
    $g.FillEllipse($brush, 1, 1, $size - 2, $size - 2)
    $brush.Dispose()

    # Borde azul
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), [float]($size * 0.04))
    $g.DrawEllipse($pen, 2, 2, $size - 4, $size - 4)
    $pen.Dispose()

    # Círculo del reloj
    $cr = $r * 0.65
    $ox = $cx - $cr
    $oy = $cy - $cr
    $pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(147, 197, 253), [float]($size * 0.05))
    $g.DrawEllipse($pen2, [float]$ox, [float]$oy, [float]($cr * 2), [float]($cr * 2))
    $pen2.Dispose()

    # Manecilla hora (10 en punto)
    $angle = -[Math]::PI / 2 - [Math]::PI / 3
    $penH = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), [float]($size * 0.06))
    $penH.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penH.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penH,
        [float]$cx, [float]$cy,
        [float]($cx + [Math]::Cos($angle) * $cr * 0.55),
        [float]($cy + [Math]::Sin($angle) * $cr * 0.55))
    $penH.Dispose()

    # Manecilla minutos (12 en punto)
    $penM = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(56, 189, 248), [float]($size * 0.04))
    $penM.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penM.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penM, [float]$cx, [float]$cy, [float]$cx, [float]($cy - $cr * 0.75))
    $penM.Dispose()

    # Punto central
    $dotR = $size * 0.05
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))
    $g.FillEllipse($dotBrush, [float]($cx - $dotR), [float]($cy - $dotR), [float]($dotR * 2), [float]($dotR * 2))
    $dotBrush.Dispose()

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Creado: $outPath"
}

$base = Join-Path $PSScriptRoot "icons"
if (-not (Test-Path $base)) { New-Item -ItemType Directory -Path $base | Out-Null }
Create-Icon -size 16  -outPath "$base\icon16.png"
Create-Icon -size 48  -outPath "$base\icon48.png"
Create-Icon -size 128 -outPath "$base\icon128.png"
Write-Output "Iconos generados correctamente"