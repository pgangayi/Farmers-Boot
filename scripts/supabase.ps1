#!/usr/bin/env pwsh
# Farmers Boot - Supabase Management Script

param(
    [string]$Action = "status"
)

switch ($Action.ToLower()) {
    "status" {
        Write-Host "Supabase Container Status:" -ForegroundColor Cyan
        docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        Write-Host ""
        Write-Host "Access URLs:" -ForegroundColor Cyan
        Write-Host "  Studio:       http://localhost:54323" -ForegroundColor White
        Write-Host "  API:          http://localhost:54321" -ForegroundColor White
        Write-Host "  Auth:         http://localhost:54321/auth/v1" -ForegroundColor White
        Write-Host "  DB:           localhost:54322" -ForegroundColor White
        Write-Host "  Email:        http://localhost:54324" -ForegroundColor White
        Write-Host "  Analytics:    http://localhost:54327" -ForegroundColor White
        Write-Host ""
        Write-Host "Auth Settings:" -ForegroundColor Cyan
        Write-Host "  Email Signup:  Enabled" -ForegroundColor Green
        Write-Host "  Auto Confirm:  Enabled" -ForegroundColor Green
        Write-Host "  JWT Secret:    super-secret-jwt-token-with-at-least-32-characters-long" -ForegroundColor Gray
    }
    "db" {
        Write-Host "Connecting to PostgreSQL..." -ForegroundColor Green
        docker exec -it supabase_db_Fin-Master psql -U postgres -d postgres
    }
    "logs" {
        Write-Host "Showing Supabase logs..." -ForegroundColor Yellow
        docker logs -f supabase_db_Fin-Master
    }
    "restart" {
        Write-Host "Restarting Supabase containers..." -ForegroundColor Yellow
        docker restart supabase_db_Fin-Master supabase_kong_Fin-Master supabase_studio_Fin-Master supabase_auth_Fin-Master supabase_rest_Fin-Master supabase_storage_Fin-Master supabase_realtime_Fin-Master supabase_inbucket_Fin-Master supabase_analytics_Fin-Master
    }
    "stop" {
        Write-Host "Stopping Supabase containers..." -ForegroundColor Yellow
        docker stop supabase_db_Fin-Master supabase_kong_Fin-Master supabase_studio_Fin-Master supabase_auth_Fin-Master supabase_rest_Fin-Master supabase_storage_Fin-Master supabase_realtime_Fin-Master supabase_inbucket_Fin-Master supabase_analytics_Fin-Master
    }
    "start" {
        Write-Host "Starting Supabase containers..." -ForegroundColor Yellow
        docker start supabase_db_Fin-Master supabase_kong_Fin-Master supabase_studio_Fin-Master supabase_auth_Fin-Master supabase_rest_Fin-Master supabase_storage_Fin-Master supabase_realtime_Fin-Master supabase_inbucket_Fin-Master supabase_analytics_Fin-Master
    }
    "migrate" {
        Write-Host "Applying database migrations..." -ForegroundColor Yellow
        Get-Content migrations/supabase/001_initial_schema.sql | docker exec -i supabase_db_Fin-Master psql -U postgres -d postgres
        Get-Content migrations/supabase/002_health_check.sql | docker exec -i supabase_db_Fin-Master psql -U postgres -d postgres
        Write-Host "Migrations applied successfully!" -ForegroundColor Green
    }
    default {
        Write-Host "Usage: .\scripts\supabase.ps1 [status|db|logs|restart|stop|start|migrate]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Actions:" -ForegroundColor White
        Write-Host "  status  - Show container status and access URLs" -ForegroundColor Gray
        Write-Host "  db      - Connect to database with psql" -ForegroundColor Gray
        Write-Host "  logs    - View database logs" -ForegroundColor Gray
        Write-Host "  restart - Restart all Supabase containers" -ForegroundColor Gray
        Write-Host "  stop    - Stop all Supabase containers" -ForegroundColor Gray
        Write-Host "  start   - Start all Supabase containers" -ForegroundColor Gray
        Write-Host "  migrate - Apply database migrations" -ForegroundColor Gray
    }
}
