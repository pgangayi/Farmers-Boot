$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "FARMERS BOOT - DEPLOYMENT SCRIPT"
Write-Host "========================================"
Write-Host ""

# 1. Deploy API (Worker)
Write-Host "[1/3] Deploying API (Cloudflare Worker)..."
Push-Location apps/api
try {
    cmd /c "npx wrangler deploy"
    if ($LASTEXITCODE -ne 0) { throw "API deployment failed" }
}
finally {
    Pop-Location
}

# 2. Build Web
Write-Host "[2/3] Building Web..."
Push-Location apps/web
try {
    cmd /c "npm run build"
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
}
finally {
    Pop-Location
}

# 3. Deploy Web (Pages)
Write-Host "[3/3] Deploying Web (Cloudflare Pages)..."
Push-Location apps/web
try {
    # Using 'dist' as the output directory as per vite config
    cmd /c "npx wrangler pages deploy dist"
    if ($LASTEXITCODE -ne 0) { throw "Web deployment failed" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Deployment Completed Successfully!"
