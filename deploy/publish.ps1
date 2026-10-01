# ============================================================
# YMA - no-git deploy, LOCAL SIDE (Windows PowerShell)
#
#   .\deploy\publish.ps1 -Host root@<DROPLET_IP>
#
# Packages the repo, uploads it over SCP, then runs
# deploy/publish-remote.sh on the droplet. Git is never used.
#
# Secrets are never uploaded: backend/.env and
# frontend/.env.production stay on the server and are preserved
# there. The script aborts if a .env ever appears in the archive.
# ============================================================
[CmdletBinding()]
param(
    # Target as user@host, e.g. root@203.0.113.10
    [Parameter(Mandatory = $true)]
    [string]$Host_,

    # Remote paths (override only if you changed the server layout)
    [string]$AppDir = '/var/www/yma',
    [string]$Tarball = '/tmp/yma-release.tar.gz'
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$RemoteSh   = Join-Path $PSScriptRoot 'publish-remote.sh'
$LocalTar   = Join-Path $env:TEMP 'yma-release.tar.gz'

function Log($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Die($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $RemoteSh)) { Die "publish-remote.sh not found at $RemoteSh" }

# --- 1. Build the archive ---------------------------------------
# Exclude build outputs, dependencies, VCS data, and every secret.
# Exclude build outputs, dependencies, VCS data, logs and archives.
# Secrets are listed by exact name on purpose: a blanket '.env.*' rule
# would also drop the committed .example templates, which the server
# needs as the reference for filling in real values.
$excludes = @(
    '--exclude=node_modules'
    '--exclude=.next'
    '--exclude=out'
    '--exclude=dist'
    '--exclude=.git'
    '--exclude=*.log'
    '--exclude=*.zip'
    '--exclude=*.tar.gz'
    '--exclude=./backend/.env'
    '--exclude=./frontend/.env'
    '--exclude=./frontend/.env.production'
    '--exclude=./backend/.env.local'
    '--exclude=./frontend/.env.local'
    '--exclude=./.env'
)

Log "Packaging repository"
Log "  source : $RepoRoot"
Log "  output : $LocalTar"

Push-Location $RepoRoot
try {
    & tar -czf $LocalTar @excludes -C $RepoRoot .
    if ($LASTEXITCODE -ne 0) { Die "tar failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

if (-not (Test-Path $LocalTar)) { Die "archive was not created" }

# --- 2. Safety check: refuse to ship secrets ---------------------
Log "Verifying archive contains no secrets"
$listing = & tar -tzf $LocalTar

$offenders = $listing | Where-Object {
    # any .env or .env.* that is NOT a committed example template
    ($_ -match '(^|/)\.env(\..*)?$') -and ($_ -notmatch '\.example$')
}
if ($offenders) {
    Write-Host "Secret files detected in archive:" -ForegroundColor Red
    $offenders | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    Die "refusing to upload secrets"
}
$fileCount = ($listing | Measure-Object).Count
Log "  $fileCount files, no secrets - OK"

# --- 3. Upload --------------------------------------------------
Log "Uploading to ${Host_}"
& scp $LocalTar "${Host_}:$Tarball"
if ($LASTEXITCODE -ne 0) { Die "scp of archive failed" }

& scp $RemoteSh "${Host_}:/tmp/yma-publish-remote.sh"
if ($LASTEXITCODE -ne 0) { Die "scp of publish-remote.sh failed" }

& ssh $Host_ "chmod +x /tmp/yma-publish-remote.sh"
if ($LASTEXITCODE -ne 0) { Die "chmod failed" }

Remove-Item $LocalTar -ErrorAction SilentlyContinue

# --- 4. Run the remote deploy -----------------------------------
Log "Running remote deploy (build takes a few minutes)"
Log "  APP_DIR=$AppDir  RELEASE_TARBALL=$Tarball"

& ssh $Host_ "APP_DIR='$AppDir' RELEASE_TARBALL='$Tarball' /tmp/yma-publish-remote.sh"
$remoteExit = $LASTEXITCODE

& ssh $Host_ "rm -f /tmp/yma-publish-remote.sh $Tarball" 2>&1 | Out-Null

if ($remoteExit -ne 0) { Die "remote deploy failed with exit code $remoteExit" }

Log "Deploy complete. Verify with:  ssh $Host_ -t 'cd $AppDir && bash deploy/smoke-test.sh'"
