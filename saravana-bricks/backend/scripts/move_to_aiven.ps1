# Copies the local saravana_bricks_db (all tables + data) to an Aiven MySQL service.
#
#   cd saravana-bricks\backend
#   powershell -ExecutionPolicy Bypass -File scripts\move_to_aiven.ps1
#
# 1. Creates the tables and reporting views on Aiven with the app's own migrations.
# 2. Dumps the local data only (no schema) and imports it into Aiven.
# 3. Compares row counts table by table.
# Login sessions are not copied (you just sign in again). Your local database is
# only read, never changed. Your .env is not changed.

$ErrorActionPreference = "Stop"
$Backend = Split-Path -Parent $PSScriptRoot
Set-Location $Backend

$MysqlBin = "C:\Program Files\MySQL\MySQL Server 26.7\bin"
if (-not (Test-Path "$MysqlBin\mysqldump.exe")) { $MysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin" }
$CaPem = Join-Path $Backend "ca.pem"
if (-not (Test-Path $CaPem)) { throw "ca.pem not found. Download the CA certificate from Aiven and save it as $CaPem" }

Write-Host "`n=== Aiven connection details (from the Aiven service Overview page) ===" -ForegroundColor Cyan
$AivenHost = (Read-Host "Host (e.g. mysql-xxxx.aivencloud.com)").Trim()
$AivenPort = (Read-Host "Port (a number)").Trim()
$AivenUser = (Read-Host "User [avnadmin]").Trim(); if (-not $AivenUser) { $AivenUser = "avnadmin" }
$AivenDb   = (Read-Host "Database [defaultdb]").Trim(); if (-not $AivenDb) { $AivenDb = "defaultdb" }
$Secure    = Read-Host "Password" -AsSecureString
$AivenPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure))
if ($AivenPort -notmatch '^\d+$') { throw "Port must be a number, got '$AivenPort'" }

$EncPass  = [Uri]::EscapeDataString($AivenPass)
$CaUrl    = $CaPem -replace '\\', '/'
$AivenUrl = "mysql+pymysql://${AivenUser}:${EncPass}@${AivenHost}:${AivenPort}/${AivenDb}?ssl_ca=$CaUrl"

# The local URL comes from .env; DATABASE_URL set in this process overrides it for the app.
$LocalUrl = (& venv\Scripts\python.exe -c "from config import Config; print(Config.SQLALCHEMY_DATABASE_URI)").Trim()
if ($LocalUrl -match "aivencloud") { throw ".env already points to Aiven. Point DATABASE_URL in .env back to your local MySQL first." }
$Parts = & venv\Scripts\python.exe -c "import sys; from sqlalchemy.engine.url import make_url; u = make_url(sys.argv[1]); print(u.database); print(u.username or 'root'); print(u.host or 'localhost'); print(u.port or 3306); print(u.password or '')" $LocalUrl
$LocalDb, $LocalUser, $LocalHost, $LocalPort = $Parts[0..3]
$LocalPass = if ($Parts.Count -gt 4) { $Parts[4] } else { "" }

$env:FLASK_APP = "app.py"
$env:DATABASE_URL = $AivenUrl

Write-Host "`n=== 1/4  Creating tables and views on Aiven ===" -ForegroundColor Cyan
& venv\Scripts\flask.exe db upgrade
if ($LASTEXITCODE -ne 0) { throw "flask db upgrade failed - check host, port, password and ca.pem" }

$Existing = (& venv\Scripts\python.exe -c "from app import app; from models import AdminUser`nwith app.app_context(): print(AdminUser.query.count())").Trim()
if ($Existing -ne "0") { throw "Aiven already has data (admin_users = $Existing). Stopping so nothing is duplicated." }

Write-Host "`n=== 2/4  Exporting local data from '$LocalDb' ===" -ForegroundColor Cyan
$Dump = Join-Path $env:TEMP "ssb-data-$(Get-Date -Format yyyyMMddHHmmss).sql"
$env:MYSQL_PWD = $LocalPass
& "$MysqlBin\mysqldump.exe" -u $LocalUser -h $LocalHost -P $LocalPort --no-create-info --skip-triggers --set-gtid-purged=OFF `
    --complete-insert --skip-add-locks --no-tablespaces --default-character-set=utf8mb4 `
    --ignore-table="$LocalDb.alembic_version" --ignore-table="$LocalDb.admin_sessions" `
    --result-file="$Dump" $LocalDb
$DumpExit = $LASTEXITCODE
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
if ($DumpExit -ne 0) { throw "mysqldump failed" }

try {
    Write-Host "`n=== 3/4  Importing into Aiven ===" -ForegroundColor Cyan
    $env:MYSQL_PWD = $AivenPass
    & "$MysqlBin\mysql.exe" --ssl-ca="$CaPem" --ssl-mode=VERIFY_CA --default-character-set=utf8mb4 `
        -h $AivenHost -P $AivenPort -u $AivenUser $AivenDb -e "source $($Dump -replace '\\','/')"
    if ($LASTEXITCODE -ne 0) { throw "Import into Aiven failed" }
}
finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    Remove-Item $Dump -ErrorAction SilentlyContinue   # contains customer data
}

Write-Host "`n=== 4/4  Comparing row counts (local vs Aiven) ===" -ForegroundColor Cyan
$Check = @"
import sys
from sqlalchemy import create_engine, inspect, text
local, aiven = create_engine(sys.argv[1]), create_engine(sys.argv[2])
ok = True
for t in sorted(inspect(local).get_table_names()):
    if t in ("alembic_version", "admin_sessions"):
        continue
    with local.connect() as a, aiven.connect() as b:
        n1 = a.execute(text(f"SELECT COUNT(*) FROM ``{t}``")).scalar()
        n2 = b.execute(text(f"SELECT COUNT(*) FROM ``{t}``")).scalar()
    ok &= n1 == n2
    print(f"  {t:24} local {n1:5}   aiven {n2:5}   {'OK' if n1 == n2 else 'MISMATCH'}")
with aiven.connect() as b:
    views = inspect(aiven).get_view_names()
print("  views on Aiven:", ", ".join(sorted(views)))
sys.exit(0 if ok else 1)
"@
$Check | & venv\Scripts\python.exe - $LocalUrl $AivenUrl
if ($LASTEXITCODE -ne 0) { throw "Row counts differ - see above" }

Write-Host "`nDone. All data is on Aiven." -ForegroundColor Green
Write-Host "Use this DATABASE_URL on Render (Environment tab):" -ForegroundColor Green
Write-Host "  mysql+pymysql://${AivenUser}:<PASSWORD>@${AivenHost}:${AivenPort}/${AivenDb}?ssl_ca=ca.pem"
Write-Host "(replace <PASSWORD> with your Aiven password, URL-encoded: @ -> %40, # -> %23, / -> %2F)"
