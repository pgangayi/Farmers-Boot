#!/usr/bin/env pwsh
# =============================================================================
# SUPABASE LOCAL DOCKER STARTUP SCRIPT
# =============================================================================
# This script starts the full Supabase Docker stack for local development
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Supabase Local Docker Stack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerStatus = docker info 2>&1
    if ($dockerStatus -match "Cannot connect|Docker is not running") {
        Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not installed or not running." -ForegroundColor Red
    exit 1
}

# Check if supabase config file exists and copy it for local overrides
$envFile = "supabase/.env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file from supabase/.env..." -ForegroundColor Yellow
    Copy-Item supabase/.env .env.supabase.local -Force
}

# ensure API_EXTERNAL_URL is present for the auth container
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    if (-not ($content -match '^API_EXTERNAL_URL=')) {
        Write-Host "Adding default API_EXTERNAL_URL to supabase/.env" -ForegroundColor Yellow
        Add-Content $envFile "API_EXTERNAL_URL=http://localhost:54321"
    }
}

# --------------------------------------------------------------------------
# Inject environment variables needed by the web frontend.  The local supabase
# docker environment writes its settings to supabase/.env; copy the public URL
# and anon key into the web project's .env.local so Vite can consume them.
# --------------------------------------------------------------------------
$webEnvFile = "apps/web/.env.local"

if (Test-Path $envFile) {
    # read relevant entries from supabase/.env
    $lines = Get-Content $envFile | Where-Object { $_ -match '^(SUPABASE_PUBLIC_URL|ANON_KEY)=' }
    $map = @{}
    foreach ($line in $lines) {
        if ($line -match '^SUPABASE_PUBLIC_URL=(.*)$') { $map['VITE_SUPABASE_URL'] = $matches[1] }
        elseif ($line -match '^ANON_KEY=(.*)$') { $map['VITE_SUPABASE_ANON_KEY'] = $matches[1] }
    }

    if ($map.Count -gt 0) {
        Write-Host "Updating web app environment file with Supabase values..." -ForegroundColor Yellow
        # ensure directory exists
        $null = New-Item -ItemType File -Force -Path $webEnvFile
        foreach ($k in $map.Keys) {
            # remove existing line if present and append new value
            (Get-Content $webEnvFile | Where-Object { $_ -notmatch "^$k=" }) |
                Set-Content $webEnvFile
            Add-Content $webEnvFile "$k=$($map[$k])"
        }
    }
}

# Pull latest images (optional, can be skipped for faster startup)
Write-Host "Pulling latest Supabase Docker images..." -ForegroundColor Yellow
docker compose -f docker-compose.supabase.yml pull

# Start the containers
Write-Host "Starting Supabase containers..." -ForegroundColor Yellow
docker compose -f docker-compose.supabase.yml up -d

# Wait for services to be healthy
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
$maxWait = 120
$elapsed = 0
$interval = 5

while ($elapsed -lt $maxWait) {
    $dbHealthy = (docker compose -f docker-compose.supabase.yml ps db 2>$null | Select-String "healthy" -Quiet)
    $kongHealthy = (docker compose -f docker-compose.supabase.yml ps kong 2>$null | Select-String "healthy" -Quiet)

    if ($dbHealthy -and $kongHealthy) {
        Write-Host "All core services are healthy!" -ForegroundColor Green
        break
    }

    Start-Sleep -Seconds $interval
    $elapsed += $interval
    Write-Host "Waiting for services... ($elapsed/$maxWait seconds)" -ForegroundColor Yellow
}

if ($elapsed -ge $maxWait) {
    Write-Host "Warning: Some services may not be fully healthy yet. Check logs with: docker compose -f docker-compose.supabase.yml logs" -ForegroundColor Yellow
}

# Display service URLs
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase Local Stack is Running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  - Kong API Gateway:  http://localhost:54321" -ForegroundColor White
Write-Host "  - Kong Admin:        http://localhost:8001" -ForegroundColor White
Write-Host "  - Studio (Dashboard): http://localhost:54323" -ForegroundColor White
Write-Host "  - PostgREST API:    http://localhost:54321/rest/v1" -ForegroundColor White
Write-Host "  - Auth API:         http://localhost:54321/auth/v1" -ForegroundColor White
Write-Host "  - Database:         localhost:54322" -ForegroundColor White
Write-Host "  - Realtime:         ws://localhost:54321/realtime/v1" -ForegroundColor White
Write-Host "  - Storage:          http://localhost:54321/storage/v1" -ForegroundColor White
Write-Host "  - Meta API:         http://localhost:8080" -ForegroundColor White
Write-Host "  - Inbucket (Email): http://localhost:9000" -ForegroundColor White
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Yellow
Write-Host "  - Email:    admin@example.com" -ForegroundColor White
Write-Host "  - Password: postgres" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  - View logs:  docker compose -f docker-compose.supabase.yml logs -f" -ForegroundColor White
Write-Host "  - Stop:       docker compose -f docker-compose.supabase.yml down" -ForegroundColor White
Write-Host "  - Stop + Vol: docker compose -f docker-compose.supabase.yml down -v" -ForegroundColor White
Write-Host ""
