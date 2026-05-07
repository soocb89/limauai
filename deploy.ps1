Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "==> Starting Postgres + Redis..." -ForegroundColor Cyan
docker compose up -d

Write-Host "==> Waiting for Postgres to be ready..." -ForegroundColor Cyan
$tries = 0
do {
    Start-Sleep -Seconds 2
    $tries++
    $result = docker exec limauai-postgres pg_isready -U limauai 2>&1
} while ($result -notmatch "accepting connections" -and $tries -lt 20)

if ($tries -ge 20) { Write-Error "Postgres did not start in time."; exit 1 }
Write-Host "    Postgres ready." -ForegroundColor Green

Write-Host "==> Building backend..." -ForegroundColor Cyan
Set-Location $root
npm run build

Write-Host "==> Running migrations..." -ForegroundColor Cyan
node dist/db/migrate.js

Write-Host "==> Seeding default bot config..." -ForegroundColor Cyan
node dist/db/seed.js

Write-Host "==> Building admin UI..." -ForegroundColor Cyan
Set-Location "$root\admin"
npm run build

Set-Location $root

Write-Host "==> Starting all processes with PM2..." -ForegroundColor Cyan
pm2 delete limauai 2>$null; $true
pm2 delete limauai-admin 2>$null; $true
pm2 delete cloudflared 2>$null; $true
pm2 start ecosystem.config.cjs
pm2 save

Set-Location $root

Write-Host ""
Write-Host "==> All services running:" -ForegroundColor Green
pm2 list

Write-Host ""
Write-Host "Backend : http://localhost:3001" -ForegroundColor Yellow
Write-Host "Admin UI: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "==> To set up Cloudflare Tunnel for remote access, run:" -ForegroundColor Cyan
Write-Host "    cloudflared tunnel login"
Write-Host "    cloudflared tunnel create limauai"
Write-Host "    (then run setup-tunnel.ps1)"
