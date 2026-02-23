# Supabase Migration Guide

## Overview

This document describes the complete migration from Cloudflare Workers to Supabase Edge Functions for the Farmers Boot application. The migration leverages Supabase's free tier features including Auth, Storage, Realtime, and Edge Functions.

## Architecture

### Cloudflare Workers (Previous)

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Database**: D1 (SQLite)
- **Storage**: R2 (S3-compatible)
- **Cache**: KV (Key-Value)
- **Sessions**: Durable Objects
- **Analytics**: Analytics Engine
- **Scheduled Tasks**: Cron Triggers

### Supabase (New)

- **Runtime**: Deno Edge Functions
- **Database**: PostgreSQL (with RLS)
- **Storage**: Supabase Storage
- **Cache**: Built-in caching
- **Sessions**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Scheduled Tasks**: pg_cron (PostgreSQL extension)

## Folder Structure

```
supabase/
├── config.toml                 # Supabase CLI configuration
├── .env.example                # Environment variables template
├── init/                       # Initial database scripts
│   ├── 01-init.sql            # Extensions and schemas
│   └── 02-farmers-boot-schema.sql  # Main schema
├── migrations/                 # Database migrations
│   └── 20240101000000_add_supabase_tables.sql
├── functions/                  # Edge Functions
│   ├── index.ts               # Main router
│   ├── _shared/               # Shared utilities
│   │   ├── cors.ts           # CORS headers
│   │   ├── error-handler.ts  # Error handling
│   │   ├── supabase-client.ts # Supabase client
│   │   ├── validation.ts     # Input validation
│   │   ├── rate-limit.ts     # Rate limiting
│   │   ├── logger.ts         # Logging
│   │   ├── storage.ts        # Storage utilities
│   │   ├── audit.ts          # Audit logging
│   │   ├── realtime.ts       # Realtime utilities
│   │   ├── email.ts          # Email utilities
│   │   └── types.ts          # TypeScript types
│   ├── auth/                 # Authentication endpoints
│   ├── farms/                # Farm management
│   ├── fields/               # Field management
│   ├── crops/                # Crop management
│   ├── livestock/            # Livestock management
│   ├── inventory/            # Inventory management
│   ├── equipment/            # Equipment management
│   ├── tasks/                # Task management
│   ├── finance/              # Financial records
│   ├── weather/              # Weather data
│   ├── notifications/        # Notifications
│   ├── reports/              # Report generation
│   ├── upload/               # File uploads
│   ├── webhooks/             # Webhook management
│   ├── ai/                   # AI features
│   ├── search/               # Search functionality
│   ├── audit/                # Audit logs
│   └── locations/            # Location management
└── seed.sql                   # Seed data (optional)
```

## Feature Mapping

| Cloudflare Feature | Supabase Equivalent | Notes                                |
| ------------------ | ------------------- | ------------------------------------ |
| D1 Database        | PostgreSQL          | Full SQL support with RLS            |
| R2 Storage         | Supabase Storage    | Built-in with public/private buckets |
| KV Cache           | Built-in caching    | Automatic query caching              |
| Durable Objects    | Supabase Auth       | Session management                   |
| Analytics Engine   | Supabase Analytics  | Built-in analytics                   |
| Cron Triggers      | pg_cron             | PostgreSQL extension                 |
| Email (Resend)     | Supabase Auth Email | Built-in email templates             |

## Edge Functions

### Main Router (`index.ts`)

The main router handles all incoming requests and routes them to the appropriate function handler based on the URL path.

### Authentication (`auth/`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/reset-password` - Reset password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/verify-email` - Verify email
- `GET /auth/me` - Get current user
- `PATCH /auth/me` - Update current user

### Farms (`farms/`)

- `GET /farms` - List farms
- `POST /farms` - Create farm
- `GET /farms/:id` - Get farm details
- `PATCH /farms/:id` - Update farm
- `DELETE /farms/:id` - Delete farm

### Fields (`fields/`)

- `GET /fields` - List fields
- `POST /fields` - Create field
- `GET /fields/:id` - Get field details
- `PATCH /fields/:id` - Update field
- `DELETE /fields/:id` - Delete field

### Crops (`crops/`)

- `GET /crops` - List crops
- `POST /crops` - Create crop (admin only)
- `GET /crops/:id` - Get crop details
- `PATCH /crops/:id` - Update crop (admin only)
- `DELETE /crops/:id` - Delete crop (admin only)

### Livestock (`livestock/`)

- `GET /livestock` - List livestock
- `POST /livestock` - Add livestock
- `GET /livestock/:id` - Get livestock details
- `PATCH /livestock/:id` - Update livestock
- `DELETE /livestock/:id` - Delete livestock
- `GET /livestock/:id/health` - Get health records
- `POST /livestock/:id/health` - Add health record

### Inventory (`inventory/`)

- `GET /inventory` - List inventory
- `POST /inventory` - Add inventory item
- `GET /inventory/:id` - Get inventory details
- `PATCH /inventory/:id` - Update inventory
- `DELETE /inventory/:id` - Delete inventory
- `GET /inventory/:id/transactions` - Get transactions
- `POST /inventory/:id/transactions` - Add transaction

### Equipment (`equipment/`)

- `GET /equipment` - List equipment
- `POST /equipment` - Add equipment
- `GET /equipment/:id` - Get equipment details
- `PATCH /equipment/:id` - Update equipment
- `DELETE /equipment/:id` - Delete equipment

### Tasks (`tasks/`)

- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `GET /tasks/:id` - Get task details
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/complete` - Complete task

### Finance (`finance/`)

- `GET /finance` - List financial records
- `POST /finance` - Add financial record
- `GET /finance/summary` - Get financial summary
- `GET /finance/:id` - Get record details
- `PATCH /finance/:id` - Update record
- `DELETE /finance/:id` - Delete record

### Weather (`weather/`)

- `GET /weather` - Get weather data
- `GET /weather/forecast` - Get weather forecast
- `GET /weather/:locationId` - Get weather by location
- `GET /weather/recommendations` - Get weather recommendations

### Notifications (`notifications/`)

- `GET /notifications` - List notifications
- `POST /notifications` - Create notification (admin only)
- `GET /notifications/:id` - Get notification details
- `POST /notifications/:id/read` - Mark as read
- `POST /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Reports (`reports/`)

- `GET /reports/farm-summary` - Farm summary report
- `GET /reports/crop-yield` - Crop yield report
- `GET /reports/financial` - Financial report
- `GET /reports/inventory` - Inventory report
- `GET /reports/livestock` - Livestock report
- `GET /reports/tasks` - Tasks report

### Upload (`upload/`)

- `POST /upload` - Upload file
- `GET /upload/:filePath` - Get file URL
- `GET /upload/:filePath/signed-url` - Get signed URL
- `DELETE /upload/:filePath` - Delete file

### Webhooks (`webhooks/`)

- `GET /webhooks` - List webhooks
- `POST /webhooks` - Create webhook
- `GET /webhooks/:id` - Get webhook details
- `PATCH /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- `POST /webhooks/:id/test` - Test webhook

### AI (`ai/`)

- `POST /ai/crop-recommendation` - Get crop recommendations
- `POST /ai/pest-detection` - Detect pests
- `POST /ai/yield-prediction` - Predict yield
- `POST /ai/weather-forecast` - Get AI weather forecast

### Search (`search/`)

- `GET /search` - Search across all entities

### Audit (`audit/`)

- `GET /audit` - List audit logs (admin only)
- `GET /audit/export` - Export audit logs (admin only)

### Locations (`locations/`)

- `GET /locations` - List locations
- `POST /locations` - Create location
- `GET /locations/:id` - Get location details
- `PATCH /locations/:id` - Update location
- `DELETE /locations/:id` - Delete location

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase Project

```bash
# Create a new Supabase project at https://supabase.com/dashboard
# Get your project URL and service role key

# Link your local project
supabase link --project-ref your-project-id
```

### 3. Set Environment Variables

```bash
# Copy the example file
cp supabase/.env.example supabase/.env.local

# Edit with your credentials
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Migrations

```bash
# Start local development
supabase start

# Apply migrations
supabase db push
```

### 5. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy auth
```

### 6. Set Function Secrets

```bash
# Set secrets for edge functions
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Free Tier Features

### Supabase Free Tier Limits

| Feature        | Free Tier Limit            |
| -------------- | -------------------------- |
| Database       | 500MB PostgreSQL           |
| Storage        | 1GB                        |
| Bandwidth      | 2GB/month                  |
| Edge Functions | 500,000 invocations/month  |
| Realtime       | 200 concurrent connections |
| Auth           | 50,000 MAUs                |
| Email          | 3,000 emails/month         |

### Optimizations for Free Tier

1. **Database**: Use efficient queries and indexes
2. **Storage**: Compress images and use CDN
3. **Edge Functions**: Cache responses and use efficient code
4. **Realtime**: Limit concurrent connections
5. **Email**: Use batch notifications

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that:

- Allow users to access their own data
- Allow admins to access all data
- Prevent unauthorized access

### Authentication

- JWT-based authentication
- Refresh token rotation
- Email verification
- Password reset flow

### Rate Limiting

- Database-backed rate limiting
- Per-endpoint limits
- IP-based limits

## Monitoring

### Logs

All Edge Functions log to:

- Console logs (visible in Supabase dashboard)
- Database logs table (for audit trail)

### Analytics

Supabase provides built-in analytics for:

- Function invocations
- Database queries
- Storage usage
- Auth events

## Testing

### Local Development

```bash
# Start local Supabase
supabase start

# Access local services
# API: http://localhost:54321
# Studio: http://localhost:54323
# DB: postgresql://postgres:postgres@localhost:54322/postgres
```

### Testing Edge Functions

```bash
# Test a function locally
supabase functions serve auth

# Or use curl
curl -X POST http://localhost:54321/functions/v1/auth/login \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Migration Checklist

- [x] Create Supabase project
- [x] Set up database schema
- [x] Create Edge Functions
- [x] Implement authentication
- [x] Implement storage
- [x] Implement real-time features
- [x] Implement webhooks
- [x] Set up RLS policies
- [x] Configure environment variables
- [x] Test all endpoints
- [x] Deploy to production
- [x] Monitor usage

## Troubleshooting

### Common Issues

1. **Function not found**: Ensure function is deployed
2. **CORS errors**: Check CORS headers in function
3. **RLS policy violations**: Check user permissions
4. **Rate limit exceeded**: Wait or increase limits
5. **Storage upload failed**: Check file size and type

### Debug Mode

Enable debug logging by setting:

```bash
supabase functions deploy --debug
```

## Next Steps

1. **Frontend Integration**: Update frontend to use Supabase client
2. **Data Migration**: Migrate existing data from D1 to PostgreSQL
3. **Monitoring**: Set up alerts for usage limits
4. **Optimization**: Optimize queries and functions
5. **Documentation**: Update API documentation

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
