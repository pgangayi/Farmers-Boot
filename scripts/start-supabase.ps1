# ============================================================================
# START SUPABASE DOCKER CONTAINERS
# ============================================================================
# This script starts the Supabase Docker containers for local development
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Supabase Docker Containers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and start it before running this script" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose status..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "✗ .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.docker..." -ForegroundColor Yellow
    
    if (Test-Path ".env.docker") {
        Copy-Item ".env.docker" ".env"
        Write-Host "✓ .env file created from .env.docker" -ForegroundColor Green
        Write-Host "⚠ Please update the .env file with secure values before starting" -ForegroundColor Yellow
        Write-Host "  - Generate a new JWT_SECRET: openssl rand -base64 32" -ForegroundColor Yellow
        Write-Host "  - Update POSTGRES_PASSWORD" -ForegroundColor Yellow
        Write-Host "  - Generate new ANON_KEY and SERVICE_ROLE_KEY" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue with default values? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Please update .env file and run this script again" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "✗ .env.docker file not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ .env file found" -ForegroundColor Green
}

# Start the containers
Write-Host ""
Write-Host "Starting Supabase containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host ""

try {
    docker compose -f docker-compose.supabase.yml up -d
    
    Write-Host ""
    Write-Host "✓ Containers started successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Wait for services to be healthy
    Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Show running containers
    Write-Host ""
    Write-Host "Running containers:" -ForegroundColor Cyan
    docker compose -f docker-compose.supabase.yml ps
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Supabase is now running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  • Supabase Studio:  http://localhost:3000" -ForegroundColor White
    Write-Host "  • API Gateway:      http://localhost:8000" -ForegroundColor White
    Write-Host "  • Kong Admin:       http://localhost:8001" -ForegroundColor White
    Write-Host "  • Email Testing:    http://localhost:9000" -ForegroundColor White
    Write-Host "  • Database:         localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  • View logs:        docker compose -f docker-compose.supabase.yml logs -f" -ForegroundColor White
    Write-Host "  • Stop services:    docker compose -f docker-compose.supabase.yml down" -ForegroundColor White
    Write-Host "  • Restart services: docker compose -f docker-compose.supabase.yml restart" -ForegroundColor White
    Write-Host ""
    Write-Host "For more information, see docs/DOCKER_SUPABASE.md" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ Failed to start containers" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running: docker compose -f docker-compose.supabase.yml logs" -ForegroundColor Yellow
    exit 1
}
