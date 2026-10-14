# Double-click launcher (via the desktop shortcut): starts the app in the
# background if it isn't running yet, then opens it in its own window.

$ErrorActionPreference = 'Stop'
$Root    = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Port    = 5002
$Url     = "http://127.0.0.1:$Port"

Add-Type -AssemblyName System.Windows.Forms
function Show-Error($text) {
    [System.Windows.Forms.MessageBox]::Show($text, 'Sri Saravana Bricks', 'OK', 'Error') | Out-Null
    exit 1
}

function Test-AppUp {
    try { (Invoke-RestMethod "$Url/api/health" -TimeoutSec 2).status -eq 'healthy' } catch { $false }
}

# 1. Only a database on this computer needs the local MySQL service; a cloud
#    database (Aiven) just needs an internet connection.
$dbLine = Get-Content (Join-Path $Backend '.env') -ErrorAction SilentlyContinue | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
$usesLocalDb = (-not $dbLine) -or ($dbLine -match '@(localhost|127\.0\.0\.1)[:/]')
$mysql = Get-Service | Where-Object { $_.Name -like 'MySQL*' } | Select-Object -First 1
if ($usesLocalDb -and $mysql -and $mysql.Status -ne 'Running') {
    try { Start-Service $mysql.Name } catch {
        Show-Error "The MySQL database service ($($mysql.Name)) is not running and could not be started.`n`nStart it from Windows Services, then try again."
    }
}

# 2. Start the server if it isn't already running.
if (-not (Test-AppUp)) {
    $busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($busy) {
        Show-Error "Port $Port is already used by another program, so the app cannot start.`n`nClose that program (or run 'Stop Sri Saravana Bricks') and try again."
    }
    $pythonw = Join-Path $Backend 'venv\Scripts\pythonw.exe'
    if (-not (Test-Path $pythonw)) { Show-Error "Python environment not found:`n$pythonw`n`nSee saravana-bricks\README.md -> First-time setup." }
    if (-not (Test-Path (Join-Path $Root 'frontend\dist\index.html'))) {
        Show-Error "The app has not been built yet.`n`nRun 'npm run build' in saravana-bricks\frontend, then try again."
    }
    Start-Process -FilePath $pythonw -ArgumentList 'serve.py' -WorkingDirectory $Backend -WindowStyle Hidden

    $deadline = (Get-Date).AddSeconds(30)
    while (-not (Test-AppUp)) {
        if ((Get-Date) -gt $deadline) {
            $hint = if ($usesLocalDb) { '' } else { "`n`nThe database is in the cloud (Aiven): check the internet connection, and that the Aiven service is running (free services power off when idle - start it from the Aiven console)." }
            Show-Error "The app did not start within 30 seconds.$hint`n`nDetails are in:`n$Backend\logs\server.log"
        }
        Start-Sleep -Milliseconds 500
    }
}

# 3. Open it as an app window (no tabs or address bar); fall back to the default browser.
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
          "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($edge) {
    Start-Process -FilePath $edge -ArgumentList "--app=$Url/login", '--window-size=1400,900'
} else {
    Start-Process "$Url/login"
}
