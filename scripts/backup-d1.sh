#!/bin/bash
# D1 Database Backup Script
# This script exports D1 database and uploads it to Cloudflare R2

set -e

# Configuration
DATABASE_NAME="farmers_boot"
BACKUP_BUCKET="farmers-boot-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="farmers_boot_backup_${DATE}.sql"
LOCAL_BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "apps/api/wrangler.toml" ]; then
    log_error "Please run this script from project root directory"
    exit 1
fi

cd apps/api

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    log_error "npx is not installed. Please install Node.js and npm."
    exit 1
fi

# Create local backup directory if it doesn't exist
mkdir -p "../../$LOCAL_BACKUP_DIR"

log_info "Starting D1 database backup..."
log_info "Database: $DATABASE_NAME"
log_info "Backup file: $BACKUP_FILE"

# Export database using wrangler d1 export
log_info "Exporting database to SQL..."
if npx wrangler d1 export "$DATABASE_NAME" --remote --output="../../$LOCAL_BACKUP_DIR/$BACKUP_FILE"; then
    log_info "Database exported successfully"
else
    log_error "Failed to export database"
    exit 1
fi

# Check if backup file was created
if [ ! -f "../../$LOCAL_BACKUP_DIR/$BACKUP_FILE" ]; then
    log_error "Backup file was not created"
    exit 1
fi

# Get file size
FILE_SIZE=$(du -h "../../$LOCAL_BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log_info "Backup file size: $FILE_SIZE"

# Upload to R2
log_info "Uploading backup to R2..."
if npx wrangler r2 object put "$BACKUP_BUCKET/$BACKUP_FILE" --file="../../$LOCAL_BACKUP_DIR/$BACKUP_FILE" --content-type="application/sql"; then
    log_info "Backup uploaded to R2 successfully"
else
    log_error "Failed to upload backup to R2"
    # Keep local backup for manual recovery
    log_warn "Local backup retained at: $LOCAL_BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

# Verify upload
log_info "Verifying backup in R2..."
if npx wrangler r2 object get "$BACKUP_BUCKET/$BACKUP_FILE" --pipe > /dev/null 2>&1; then
    log_info "Backup verified in R2"
else
    log_warn "Could not verify backup in R2, but upload appeared successful"
fi

# Clean up local backup (optional - comment out to keep local copies)
log_info "Cleaning up local backup file..."
rm "../../$LOCAL_BACKUP_DIR/$BACKUP_FILE"

log_info "Backup completed successfully!"
log_info "Backup location: r2://$BACKUP_BUCKET/$BACKUP_FILE"

# Retention policy enforcement (optional)
# Uncomment following lines to enforce retention policy
# log_info "Enforcing retention policy..."
# node scripts/enforce-backup-retention.js

exit 0
