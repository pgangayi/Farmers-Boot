# Farmers Boot Documentation 📚

Comprehensive documentation for the Farmers Boot farm management application.

## Quick Links

- [API Reference](#api-reference)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

## API Reference

### Base URL

- **Local Development**: `http://localhost:5757`
- **Production**: Configured via deployment settings

### Authentication Endpoints

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| POST   | `/api/auth/signup`   | Create new user account        |
| POST   | `/api/auth/login`    | Authenticate and receive token |
| GET    | `/api/auth/validate` | Validate session               |
| POST   | `/api/auth/logout`   | Invalidate session             |

### Core Endpoints

| Resource | Endpoints                                   |
| -------- | ------------------------------------------- |
| Farms    | `/api/farms` - CRUD operations for farms    |
| Animals  | `/api/animals` - Livestock management       |
| Crops    | `/api/crops` - Crop management              |
| Tasks    | `/api/tasks` - Task management              |
| Finance  | `/api/finance-enhanced` - Financial entries |

### Utility Endpoints

- `GET /api/health` - Health check
- `GET /api/search` - Global search
- `GET /api/notifications` - User notifications

---

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Wrangler CLI (optional, for local edge testing)

### Installation

```bash
npm install
npm run build:shared
npm run dev          # Starts both web and api
npm run dev:web      # Frontend only
npm run dev:api      # Backend only
```

### Environment Setup

**Frontend** (`apps/web/.env`):

```env
VITE_API_URL=http://localhost:5757
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend** (`apps/api/.env`):

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

---

## Deployment

### Frontend

```bash
npm run deploy:web
```

### Backend

```bash
npm run deploy:api
```

---

## Environment Variables

See [docs/ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for complete variable reference.

---

## Additional Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Cloudflare Setup](CLOUDFLARE_OPTIMIZATION_GUIDE.md) - Legacy (archived)
- [Supabase Migration](SUPABASE_MIGRATION_GUIDE.md)
- [Backup & Restore](BACKUP_RESTORE.md)
