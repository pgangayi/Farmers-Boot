# Supabase Setup Instructions

## Prerequisites

- Node.js installed
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created

## Setup Steps

1. **Configure Supabase**
   - Copy `supabase/config.json.example` to `supabase/config.json`
   - Update with your Supabase project credentials

2. **Initialize Database**

   ```bash
   cd scripts
   node init-supabase.js
   ```

3. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials

## Database Schema

The migration includes:

- Users and authentication
- Farms and locations management
- Livestock tracking
- Crop management
- Tasks and activities
- Financial records
- Inventory management
- Reports and analytics

## Row Level Security (RLS)

All tables have RLS policies for:

- User authentication
- Data ownership
- Access control
- Audit logging

## TypeScript Types

Generated types are saved in `supabase.types.ts` and can be imported in your application.
