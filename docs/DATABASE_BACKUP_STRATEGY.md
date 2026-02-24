# Database Backup Strategy

**Last Updated:** 2026-02-24  
**Status:** Active

---

## Overview

This document outlines the backup strategy for the Farmers-Boot PostgreSQL database hosted on Supabase. The strategy ensures data durability, disaster recovery capabilities, and compliance with data retention requirements.

---

## Backup Types

### 1. Automated Backups (Supabase Managed)

Supabase provides automated backups for all projects:

| Backup Type   | Frequency  | Retention | Recovery Point Objective (RPO) |
| ------------- | ---------- | --------- | ------------------------------ |
| Full Backup   | Daily      | 7 days    | 24 hours                       |
| WAL Archiving | Continuous | 7 days    | ~5 minutes                     |

**Configuration:**

- Enabled by default on all Supabase projects
- Managed by Supabase infrastructure
- Stored in geographically redundant storage

### 2. Manual Backups (User Initiated)

| Backup Type    | When to Use               | Storage Location   |
| -------------- | ------------------------- | ------------------ |
| Pre-deployment | Before schema migrations  | Supabase Dashboard |
| Pre-migration  | Before major data changes | Supabase Dashboard |
| On-demand      | Compliance, auditing      | External (S3/GCS)  |

---

## Backup Procedures

### Daily Operations

```bash
# No action required - Supabase handles automated backups
# Monitor backup status in Supabase Dashboard > Database > Backups
```

### Pre-Deployment Backup

```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase Dashboard:
# 1. Navigate to Database > Backups
# 2. Click "Create Backup"
# 3. Add description: "Pre-deployment backup for [version]"
```

### Manual Full Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/farmers_boot_${TIMESTAMP}.sql"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-your-project-ref}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create backup using pg_dump
pg_dump "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}.gz"

# Upload to cloud storage (optional)
if [ -n "${AWS_S3_BUCKET}" ]; then
  aws s3 cp "${BACKUP_FILE}.gz" "s3://${AWS_S3_BUCKET}/database-backups/"
  echo "Backup uploaded to S3"
fi

# Cleanup old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "*.gz" -mtime +30 -delete
echo "Old backups cleaned up"
```

---

## Recovery Procedures

### Point-in-Time Recovery (PITR)

Supabase supports PITR using WAL archiving:

1. **Via Supabase Dashboard:**

   ```
   1. Navigate to Database > Backups
   2. Click "Restore to Point in Time"
   3. Select target timestamp
   4. Confirm restoration
   ```

2. **Via Supabase CLI:**
   ```bash
   supabase db restore --timestamp "2026-02-24 10:30:00"
   ```

### Full Database Restoration

```bash
# Download backup from Supabase
supabase db dump -f restore_backup.sql

# Or restore from file
psql "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
  -f restore_backup.sql
```

### Disaster Recovery Steps

1. **Assess the situation:**
   - Determine the scope of data loss
   - Identify the recovery point needed

2. **Notify stakeholders:**
   - Alert development team
   - Notify affected users if necessary

3. **Execute recovery:**

   ```bash
   # Option 1: Point-in-time recovery
   supabase db restore --timestamp "TARGET_TIMESTAMP"

   # Option 2: Full backup restoration
   psql $DATABASE_URL -f backup_file.sql
   ```

4. **Verify recovery:**
   - Check data integrity
   - Verify application functionality
   - Run database consistency checks

5. **Document incident:**
   - Record root cause
   - Update procedures if needed

---

## Backup Monitoring

### Health Checks

```sql
-- Check last backup timestamp
SELECT * FROM pg_stat_archiver;

-- Check backup configuration
SHOW archive_mode;
SHOW archive_command;
```

### Alerting

Set up alerts for:

- Failed backup jobs
- Backup storage nearing capacity
- WAL archive lag > 1 hour

---

## Retention Policy

| Data Type         | Retention Period | Storage               |
| ----------------- | ---------------- | --------------------- |
| Automated Backups | 7 days           | Supabase (included)   |
| Manual Backups    | 30 days          | External (S3/GCS)     |
| Audit Logs        | 1 year           | Database + External   |
| Financial Records | 7 years          | External (compliance) |

---

## Security Considerations

### Backup Encryption

- All Supabase backups are encrypted at rest
- For external backups, use GPG encryption:

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

### Access Control

- Backup access restricted to:
  - Database administrators
  - DevOps team leads
  - On-call engineers (read-only)

### Compliance

- GDPR: Right to erasure applies to backups
- Financial data: 7-year retention for audit purposes
- Personal data: Anonymized in long-term backups

---

## Testing

### Backup Verification Schedule

| Test Type               | Frequency | Procedure                               |
| ----------------------- | --------- | --------------------------------------- |
| Integrity Check         | Weekly    | Automated restore to test database      |
| Full Recovery Test      | Monthly   | Complete restore to staging environment |
| Disaster Recovery Drill | Quarterly | Simulated disaster scenario             |

### Verification Script

```bash
#!/bin/bash
# scripts/verify-backup.sh

set -e

BACKUP_FILE="${1}"
TEST_DB="backup_test_$(date +%Y%m%d)"

# Create test database
psql $DATABASE_URL -c "CREATE DATABASE ${TEST_DB};"

# Restore backup to test database
psql "${DATABASE_URL/%postgres/${TEST_DB}}" -f "${BACKUP_FILE}"

# Run integrity checks
psql "${DATABASE_URL/%postgres/${TEST_DB}}" -c "
  SELECT
    (SELECT COUNT(*) FROM farms) as farms_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM livestock) as livestock_count,
    (SELECT COUNT(*) FROM crop_plans) as crop_plans_count;
"

# Cleanup
psql $DATABASE_URL -c "DROP DATABASE ${TEST_DB};"

echo "Backup verification complete"
```

---

## Cost Estimation

| Backup Type          | Storage Cost     | Transfer Cost |
| -------------------- | ---------------- | ------------- |
| Supabase Automated   | Included in plan | N/A           |
| External S3 (100GB)  | ~$2.30/month     | ~$0.09/GB     |
| External GCS (100GB) | ~$2.00/month     | ~$0.12/GB     |

---

## Contact Information

| Role     | Contact                 | Responsibility            |
| -------- | ----------------------- | ------------------------- |
| DBA Team | dba@farmers-boot.com    | Backup strategy, recovery |
| DevOps   | devops@farmers-boot.com | Automation, monitoring    |
| On-Call  | oncall@farmers-boot.com | Incident response         |

---

## Change Log

| Date       | Change                           | Author              |
| ---------- | -------------------------------- | ------------------- |
| 2026-02-24 | Initial backup strategy document | Architecture Review |

---

## Related Documents

- [Architecture Review](./FULL_ARCHITECTURE_INTEGRATION_REVIEW.md)
- [Docker Supabase Setup](./DOCKER_SUPABASE.md)
- [API Documentation](./API_DOCUMENTATION.md)
