# Creates "Sri Saravana Bricks" (open) and "Stop Sri Saravana Bricks" shortcuts on
# the Desktop and in the Start Menu. Safe to run again; it just overwrites them.

$Here = $PSScriptRoot
$Root = Split-Path -Parent $Here
$Icon = Join-Path $Here 'saravana-bricks.ico'

# Build a multi-size .ico from the logo (PNG-compressed frames, Windows Vista+).
if (-not (Test-Path $Icon)) {
    Add-Type -AssemblyName System.Drawing
    $src = [System.Drawing.Image]::FromFile((Join-Path $Root 'frontend\public\logo.jpg'))
    $frames = foreach ($size in 256, 64, 48, 32, 16) {
        $bmp = New-Object System.Drawing.Bitmap $size, $size
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = 'HighQualityBicubic'
        $g.DrawImage($src, 0, 0, $size, $size)
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose(); $bmp.Dispose()
        , @($size, $ms.ToArray())
    }
    $src.Dispose()
    $out = New-Object System.IO.MemoryStream
    $w = New-Object System.IO.BinaryWriter $out
    $w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$frames.Count)
    $offset = 6 + 16 * $frames.Count
    foreach ($f in $frames) {
        $dim = if ($f[0] -ge 256) { 0 } else { $f[0] }
        $w.Write([byte]$dim); $w.Write([byte]$dim); $w.Write([byte]0); $w.Write([byte]0)
        $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$f[1].Length); $w.Write([uint32]$offset)
        $offset += $f[1].Length
    }
    foreach ($f in $frames) { $w.Write($f[1]) }
    [IO.File]::WriteAllBytes($Icon, $out.ToArray())
}

$shell = New-Object -ComObject WScript.Shell
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$places = @([Environment]::GetFolderPath('Desktop'), (Join-Path ([Environment]::GetFolderPath('Programs')) 'Sri Saravana Bricks'))

foreach ($dir in $places) {
    New-Item -ItemType Directory -Force $dir | Out-Null
    foreach ($s in @(
        @{ Name = 'Sri Saravana Bricks'; Script = 'Start-SaravanaBricks.ps1'; Desc = 'Open the Sri Saravana Interlock Bricks billing app' },
        @{ Name = 'Stop Sri Saravana Bricks'; Script = 'Stop-SaravanaBricks.ps1'; Desc = 'Stop the Sri Saravana Bricks background server' }
    )) {
        $lnk = $shell.CreateShortcut((Join-Path $dir "$($s.Name).lnk"))
        $lnk.TargetPath = $ps
        $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $Here $s.Script)`""
        $lnk.WorkingDirectory = $Here
        $lnk.IconLocation = "$Icon,0"
        $lnk.Description = $s.Desc
        $lnk.WindowStyle = 7  # start minimised, so no console flashes up
        $lnk.Save()
    }
    Write-Output "Shortcuts created in: $dir"
}
