# Docker Supabase Setup Guide

This guide provides comprehensive instructions for running Supabase locally using Docker for the Farmers Boot application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Services Included](#services-included)
- [Configuration](#configuration)
- [Accessing Services](#accessing-services)
- [Database Schema](#database-schema)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

## Overview

This Docker setup provides a complete Supabase environment with all free tier features:

- **PostgreSQL Database** - Primary database with extensions
- **Supabase Auth (GoTrue)** - Authentication service
- **PostgREST API** - RESTful API for database access
- **Kong API Gateway** - API gateway with routing and plugins
- **Supabase Studio** - Web-based database management UI
- **Postgres Meta** - Database metadata service
- **Supabase Realtime** - Real-time subscriptions
- **Supabase Storage** - File storage service
- **Inbucket** - Email testing service
- **Vector (pgvector)** - Vector database for AI/ML features

## Prerequisites

Before starting, ensure you have:

1. **Docker** - Version 20.10 or higher

   ```bash
   docker --version
   ```

2. **Docker Compose** - Version 2.0 or higher

   ```bash
   docker compose version
   ```

3. **Git** - For cloning the repository (if needed)

   ```bash
   git --version
   ```

4. **Sufficient Resources**:
   - At least 4GB RAM available
   - At least 10GB free disk space

## Quick Start

### 1. Clone or Navigate to Project

```bash
cd c:/Users/MunyaradziGangayi/Documents/Coder/Farmers-Boot
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
# Windows (PowerShell)
Copy-Item .env.docker .env

# Windows (CMD)
copy .env.docker .env

# Linux/Mac
cp .env.docker .env
```

**Important**: Update the `.env` file with secure values:

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

Update these values in `.env`:

- `JWT_SECRET` - Use the generated secret
- `POSTGRES_PASSWORD` - Set a strong password
- `ANON_KEY` - Generate new keys for production
- `SERVICE_ROLE_KEY` - Generate new keys for production

### 3. Start Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.supabase.yml up -d

# Or start with logs visible
docker compose -f docker-compose.supabase.yml up
```

### 4. Verify Services

Check that all services are running:

```bash
docker compose -f docker-compose.supabase.yml ps
```

Expected output should show all services as "Up" or "healthy".

### 5. Access Supabase Studio

Open your browser and navigate to:

```
http://localhost:3000
```

You can now manage your database, view tables, and test queries.

## Services Included

| Service         | Port | Description             | Access URL                      |
| --------------- | ---- | ----------------------- | ------------------------------- |
| PostgreSQL      | 5432 | Primary database        | `localhost:5432`                |
| Auth (GoTrue)   | 9999 | Authentication service  | `http://localhost:9999`         |
| PostgREST API   | 3000 | REST API (via Kong)     | `http://localhost:8000/rest/v1` |
| Kong Gateway    | 8000 | API gateway             | `http://localhost:8000`         |
| Kong Admin      | 8001 | Kong admin API          | `http://localhost:8001`         |
| Supabase Studio | 3000 | Database UI             | `http://localhost:3000`         |
| Postgres Meta   | 8080 | Metadata service        | `http://localhost:8080`         |
| Realtime        | 4000 | Real-time subscriptions | `http://localhost:4000`         |
| Storage         | 5000 | File storage            | `http://localhost:5000`         |
| Inbucket        | 9000 | Email testing UI        | `http://localhost:9000`         |
| Inbucket SMTP   | 2500 | Email SMTP              | `localhost:2500`                |
| Vector DB       | 5433 | Vector database         | `localhost:5433`                |

## Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
JWT_EXPIRY=3600

# Supabase Keys
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs
SUPABASE_URL=http://localhost:8000
SITE_URL=http://localhost:3000
```

### Connecting Your Application

Update your application's environment variables:

```bash
# For apps/web
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-anon-key-from-env

# For apps/api
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your-anon-key-from-env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

## Accessing Services

### Supabase Studio

1. Open `http://localhost:3000` in your browser
2. Sign in with email/password (create a new account)
3. Access the SQL Editor, Table Editor, and Authentication tabs

### API Endpoints

#### REST API (via Kong)

```bash
# List all tables
curl http://localhost:8000/rest/v1/

# Query a table
curl http://localhost:8000/rest/v1/profiles

# With authentication
curl http://localhost:8000/rest/v1/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "apikey: YOUR_ANON_KEY"
```

#### Auth API

```bash
# Sign up
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:8000/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

#### Storage API

```bash
# List buckets
curl http://localhost:8000/storage/v1/bucket

# Upload a file
curl -X POST http://localhost:8000/storage/v1/object/avatars/test.png \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --data-binary @test.png
```

#### Realtime API

```bash
# Subscribe to changes
curl -X POST http://localhost:8000/realtime/v1/subscribe \
  -H "Content-Type: application/json" \
  -d '{"topic":"profiles"}'
```

### Database Access

#### Using psql

```bash
psql -h localhost -p 5432 -U postgres -d postgres
```

#### Using DBeaver, pgAdmin, or other tools

- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `postgres` (or your configured password)

### Email Testing (Inbucket)

1. Open `http://localhost:9000` in your browser
2. View all emails sent by the application
3. Test email verification, password reset, etc.

## Database Schema

The database includes the following schemas and tables:

### Schemas

- `public` - Main application tables
- `auth` - Supabase authentication tables
- `storage` - File storage tables
- `realtime` - Real-time subscription tables
- `graphql_public` - GraphQL schema
- `extensions` - Database extensions

### Main Tables (Farmers Boot)

- `profiles` - User profiles
- `farms` - Farm information
- `locations` - Geographic locations
- `fields` - Farm fields
- `crops` - Crop types
- `crop_plans` - Crop planting plans
- `crop_activities` - Crop management activities
- `livestock` - Livestock records
- `livestock_health` - Livestock health records
- `inventory` - Inventory items
- `inventory_transactions` - Inventory transactions
- `equipment` - Farm equipment
- `tasks` - Farm tasks
- `financial_records` - Financial transactions
- `weather_data` - Weather information
- `notifications` - User notifications
- `audit_logs` - Audit trail

### Storage Buckets

Default storage buckets created:

- `avatars` - User profile images (public, 5MB max)
- `documents` - Document files (private, 10MB max)
- `images` - General images (public, 10MB max)
- `videos` - Video files (public, 100MB max)

## Common Operations

### Starting Services

```bash
# Start all services
docker compose -f docker-compose.supabase.yml up -d

# Start specific service
docker compose -f docker-compose.supabase.yml up -d db
```

### Stopping Services

```bash
# Stop all services
docker compose -f docker-compose.supabase.yml down

# Stop and remove volumes (deletes data!)
docker compose -f docker-compose.supabase.yml down -v
```

### Viewing Logs

```bash
# View all logs
docker compose -f docker-compose.supabase.yml logs

# View specific service logs
docker compose -f docker-compose.supabase.yml logs db

# Follow logs in real-time
docker compose -f docker-compose.supabase.yml logs -f
```

### Restarting Services

```bash
# Restart all services
docker compose -f docker-compose.supabase.yml restart

# Restart specific service
docker compose -f docker-compose.supabase.yml restart db
```

### Rebuilding Services

```bash
# Rebuild and restart
docker compose -f docker-compose.supabase.yml up -d --build

# Rebuild specific service
docker compose -f docker-compose.supabase.yml up -d --build db
```

### Database Backups

```bash
# Backup database
docker compose -f docker-compose.supabase.yml exec db pg_dump -U postgres postgres > backup.sql

# Restore database
docker compose -f docker-compose.supabase.yml exec -T db psql -U postgres postgres < backup.sql
```

### Running SQL Scripts

```bash
# Execute SQL file
docker compose -f docker-compose.supabase.yml exec -T db psql -U postgres postgres < script.sql

# Interactive SQL
docker compose -f docker-compose.supabase.yml exec db psql -U postgres postgres
```

### Updating Schema

1. Create a new migration file in `supabase/migrations/`
2. Run the migration:

```bash
docker compose -f docker-compose.supabase.yml exec db psql -U postgres postgres -f /docker-entrypoint-initdb.d/your-migration.sql
```

## Troubleshooting

### Services Won't Start

**Problem**: Services fail to start or show unhealthy status.

**Solution**:

```bash
# Check logs
docker compose -f docker-compose.supabase.yml logs

# Check resource usage
docker stats

# Restart services
docker compose -f docker-compose.supabase.yml restart
```

### Port Conflicts

**Problem**: Ports are already in use.

**Solution**: Modify ports in `docker-compose.supabase.yml`:

```yaml
ports:
  - '5433:5432' # Change 5432 to 5433
```

### Database Connection Issues

**Problem**: Cannot connect to database.

**Solution**:

1. Verify database is running:

```bash
docker compose -f docker-compose.supabase.yml ps db
```

2. Check database logs:

```bash
docker compose -f docker-compose.supabase.yml logs db
```

3. Test connection:

```bash
docker compose -f docker-compose.supabase.yml exec db pg_isready -U postgres
```

### Authentication Issues

**Problem**: JWT token errors or authentication failures.

**Solution**:

1. Verify JWT_SECRET matches across all services
2. Check auth service logs:

```bash
docker compose -f docker-compose.supabase.yml logs auth
```

3. Regenerate keys if needed

### Storage Issues

**Problem**: File upload/download failures.

**Solution**:

1. Check storage service logs:

```bash
docker compose -f docker-compose.supabase.yml logs storage
```

2. Verify bucket permissions in Supabase Studio
3. Check file size limits

### Realtime Not Working

**Problem**: Real-time subscriptions not receiving updates.

**Solution**:

1. Check realtime service logs:

```bash
docker compose -f docker-compose.supabase.yml logs realtime
```

2. Verify publication settings:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE your_table_name;
```

### Out of Disk Space

**Problem**: Docker volumes filling up.

**Solution**:

```bash
# Clean up unused resources
docker system prune -a

# View volume usage
docker system df -v

# Remove specific volumes (WARNING: deletes data!)
docker volume rm farmers-boot_db_data
```

### Reset Everything

**Problem**: Need to start fresh.

**Solution**:

```bash
# Stop and remove everything including data
docker compose -f docker-compose.supabase.yml down -v

# Remove images
docker rmi $(docker images -q supabase/*)

# Start fresh
docker compose -f docker-compose.supabase.yml up -d
```

## Security Notes

### Development vs Production

This setup is intended for **development only**. For production:

1. **Generate secure keys**:

   ```bash
   openssl rand -base64 32
   ```

2. **Use strong passwords** for PostgreSQL

3. **Enable SSL/TLS** for all connections

4. **Set up proper CORS** origins

5. **Use environment-specific** configuration files

6. **Implement rate limiting** and IP restrictions

7. **Regular security updates** for all services

8. **Backup strategy** for production data

### Environment Variables

Never commit `.env` files to version control. Use:

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### Access Control

- Use Row Level Security (RLS) policies
- Implement proper authentication flows
- Validate all user inputs
- Use prepared statements for SQL queries

### Data Protection

- Regular backups
- Encryption at rest
- Secure transmission (HTTPS)
- Data retention policies

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kong Documentation](https://docs.konghq.com/)

## Support

For issues specific to this setup:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review service logs
3. Verify environment configuration
4. Check Docker and Docker Compose versions

For general Supabase questions, visit the [Supabase Community](https://supabase.com/community).
