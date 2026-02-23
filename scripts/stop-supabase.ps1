# ============================================================================
# STOP SUPABASE DOCKER CONTAINERS
# ============================================================================
# This script stops the Supabase Docker containers
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping Supabase Docker Containers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
Write-Host "Checking running containers..." -ForegroundColor Yellow
$runningContainers = docker compose -f docker-compose.supabase.yml ps -q

if (-not $runningContainers) {
    Write-Host "✓ No Supabase containers are currently running" -ForegroundColor Green
    exit 0
}

Write-Host "Found running containers" -ForegroundColor Green
Write-Host ""

# Ask if user wants to remove volumes
Write-Host "Do you want to remove volumes as well?" -ForegroundColor Yellow
Write-Host "  WARNING: This will delete all data!" -ForegroundColor Red
$removeVolumes = Read-Host "Remove volumes? (y/N)"

Write-Host ""
Write-Host "Stopping containers..." -ForegroundColor Yellow

try {
    if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
        docker compose -f docker-compose.supabase.yml down -v
        Write-Host "✓ Containers stopped and volumes removed" -ForegroundColor Green
        Write-Host "⚠ All data has been deleted" -ForegroundColor Yellow
    } else {
        docker compose -f docker-compose.supabase.yml down
        Write-Host "✓ Containers stopped" -ForegroundColor Green
        Write-Host "✓ Data volumes preserved" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Supabase containers stopped" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ Failed to stop containers" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
