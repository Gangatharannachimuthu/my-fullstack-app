# Stops the background app server started by the launcher.

$Port = 5002
Add-Type -AssemblyName System.Windows.Forms

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
$stopped = 0
foreach ($c in $listeners) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    # Only stop our own Python server, never some other program on the port.
    if ($proc -and $proc.ProcessName -match '^pythonw?$') {
        Stop-Process -Id $proc.Id -Force
        $stopped++
    }
}

$msg = if ($stopped) { 'Sri Saravana Bricks has been stopped.' } else { 'Sri Saravana Bricks was not running.' }
[System.Windows.Forms.MessageBox]::Show($msg, 'Sri Saravana Bricks', 'OK', 'Information') | Out-Null
