# Farmers Boot - Development Setup Script (PowerShell)
# Works on Windows PowerShell and PowerShell Core

param(
    [switch]$SkipInstall,
    [switch]$CleanAll,
    [string]$EnvFile = ".env"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Color codes for PowerShell
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info { Write-ColorOutput "[INFO] $args" "Cyan" }
function Write-Success { Write-ColorOutput "[SUCCESS] $args" "Green" }
function Write-Warning { Write-ColorOutput "[WARNING] $args" "Yellow" }
function Write-Error { Write-ColorOutput "[ERROR] $args" "Red" }

Write-Info "Starting Farmers Boot development setup..."

# Check required tools
Write-Info "Checking required tools..."

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js first."
    exit 1
}

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Please install npm first."
    exit 1
}

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Warning "Docker not found. Docker is required to run the local Supabase stack."
}

Write-Success "All required tools found"

# Show tool versions
Write-Info "Tool versions:"
Write-Info "Node.js: $(node --version)"
Write-Info "npm: $(npm --version)"
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Info "Docker: $(docker --version)"
}

# Setup environment file
Write-Info "Setting up environment configuration..."

if (!(Test-Path $EnvFile)) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $EnvFile
        Write-Success "Created $EnvFile file from .env.example"
        Write-Warning "Please edit $EnvFile file with your actual values"
    } else {
        Write-Error ".env.example not found"
        exit 1
    }
} else {
    Write-Info "$EnvFile file already exists"
}

# Clean existing processes if requested or if clean all
if ($CleanAll) {
    Write-Info "Cleaning up existing processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force
}

# Clean node_modules and lock files if requested
if ($CleanAll) {
    Write-Info "Cleaning node_modules directories..."
    
    $dirs = @("", "apps/web", "packages/shared")
    foreach ($dir in $dirs) {
        $nodeModules = if ($dir) { "$dir/node_modules" } else { "node_modules" }
        $packageLock = if ($dir) { "$dir/package-lock.json" } else { "package-lock.json" }
        
        if (Test-Path $nodeModules) {
            Write-Info "Removing $nodeModules"
            Remove-Item $nodeModules -Recurse -Force | Out-Null
        }
        
        if (Test-Path $packageLock) {
            Write-Info "Removing $packageLock"
            Remove-Item $packageLock -Force
        }
    }
}

# Install dependencies unless skipped
if (!$SkipInstall) {
    Write-Info "Installing all dependencies via workspaces..."
    npm install
    
    Write-Success "All dependencies installed successfully"
} else {
    Write-Info "Skipping dependency installation"
}

# Validate environment
Write-Info "Validating environment..."

$envContent = Get-Content $EnvFile -Raw
if ($envContent -match "JWT_SECRET=your-jwt-secret") {
    Write-Warning "Please update JWT_SECRET in $EnvFile file with a secure random string"
} else {
    Write-Success "JWT_SECRET appears to be configured"
}

# Check for common issues
Write-Info "Checking for common issues..."

$issues = @()

# Check if ports are in use
$ports = @(5000, 54321, 54322, 54323)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $processInfo = Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue
        Write-Warning "Port $port is in use by: $($processInfo.ProcessName)"
        $issues += "Port $port conflict"
    }
}

if ($issues.Count -eq 0) {
    Write-Success "No common issues detected"
} else {
    Write-Warning "Issues detected:"
    foreach ($issue in $issues) {
        Write-Warning "  - $issue"
    }
}

Write-Host ""
Write-Success "Setup completed successfully!"
Write-Host ""
Write-Info "Next steps:"
Write-Info "1. Edit $EnvFile file with your actual API keys"
Write-Info "2. Run 'npm run dev' to start the web application"
Write-Info "3. Run 'npm run supabase:start' to start the local backend"
Write-Host ""
Write-Info "Available commands:"
Write-Info "  npm run dev        - Start development servers"
Write-Info "  npm run build      - Build for production"
Write-Info "  npm run test:e2e   - Run end-to-end tests"
Write-Host ""
Write-Info "To run this script with options:"
Write-Info "  .\setup-dev.ps1 -SkipInstall    # Skip dependency installation"
Write-Info "  .\setup-dev.ps1 -CleanAll       # Clean and reinstall everything"