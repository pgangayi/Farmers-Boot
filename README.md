# Farmers Boot — Turborepo Monorepo 🚀

A comprehensive farm management application built with modern technologies in a Turborepo monorepo structure.

## 📁 Monorepo Structure

```
farmers-boot/
├── apps/
│   ├── web/                 # Frontend React application
│   └── api/                 # Backend API
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── ui/                  # Shared UI components (future)
│   └── config/              # Shared configuration (future)
├── docs/                    # Documentation
├── tools/                   # Development tools and scripts
├── turbo.json              # Turborepo configuration
└── package.json            # Root workspace configuration
```

## 🏗️ Apps

### `apps/web`

- **Framework**: React + Vite + TypeScript
- **Styling**: TailwindCSS + MUI
- **Features**: Complete farm management UI
- **URL**: http://localhost:5000 (dev)

### `apps/api`

- **Framework**: Hono (Edge-ready)
- **Database**: Supabase
- **Features**: RESTful API with authentication
- **URL**: http://localhost:5757 (dev)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Wrangler CLI (optional, for local edge testing)

### Installation

```bash
# Install all dependencies
npm install

# Build shared packages
npm run build:shared

# Start development servers
npm run dev          # Starts both web and api
npm run dev:web      # Frontend only
npm run dev:api      # Backend only
```

### Development Commands

```bash
# Build all applications
npm run build

# Run all tests
npm run test

# Run tests for specific app
npm run test:web
npm run test:api

# Lint all apps
npm run lint

# Type check all apps
npm run type-check

# Clean build artifacts
npm run clean
```

## 📝 Environment Setup

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:5757
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`apps/api/.env`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

## 🚢 Deployment

### Frontend

```bash
npm run deploy:web
# or
npm run deploy:frontend:staging
npm run deploy:frontend:production
```

### Backend

```bash
npm run deploy:api
# or
npm run deploy:backend:staging
npm run deploy:backend:production
```

## 🧪 Testing

### Unit Tests

```bash
npm run test:web      # Frontend tests
npm run test:api      # Backend tests
```

### E2E Tests

```bash
npm run test:e2e      # Playwright tests
npm run test:e2e:ui   # Interactive mode
```

### Performance Tests

```bash
npm run test:performance
```

## 📚 Documentation

- `docs/README.md` - Master documentation (API, setup guides, policies)
- `docs/FUTURE_FEATURES.md` - Roadmap and planned features
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/CLOUDFLARE_OPTIMIZATION_GUIDE.md` - Legacy Cloudflare setup (archived)

## 🎯 Migration from Old Structure

The project was migrated from a separate `frontend/` and `backend/` structure to this monorepo:

- `frontend/` → `apps/web/`
- `backend/` → `apps/api/`
- Shared types extracted to `packages/shared/`

All functionality remains the same, but with improved:

- Code sharing between frontend and backend
- Unified tooling and dependencies
- Better developer experience with Turborepo

## 🤝 Contributing

1. Create a feature branch
2. Make changes in appropriate app/package
3. Run tests: `npm run test`
4. Build: `npm run build`
5. Submit PR

## 📄 License

MIT License - See LICENSE file for details

---

**Powered by [Turborepo](https://turbo.build/)** ⚡
