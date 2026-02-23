# Farmers-Boot API Documentation

## Overview

The Farmers-Boot application uses a Supabase-based backend architecture with REST API endpoints, Edge Functions, and real-time subscriptions. This documentation provides comprehensive information about all available APIs, authentication, and integration patterns.

## Table of Contents

- [Authentication](#authentication)
- [REST API Endpoints](#rest-api-endpoints)
- [Edge Functions](#edge-functions)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [File Storage](#file-storage)
- [Webhooks](#webhooks)

---

## Authentication

### Overview

Farmers-Boot uses Supabase Auth for authentication and authorization. All API endpoints (except public ones) require valid authentication.

### Authentication Methods

#### 1. JWT Token Authentication

```http
Authorization: Bearer <your-jwt-token>
apikey: <your-anon-key>
```

#### 2. Session Cookie Authentication

```http
Cookie: supabase.auth.token=<your-session-token>
```

### Getting Authentication Tokens

#### Sign Up

```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "options": {
    "data": {
      "full_name": "John Doe",
      "role": "farmer"
    }
  }
}
```

#### Sign In

```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "farmer",
    "aud": "authenticated"
  }
}
```

### User Roles

- **admin**: Full system access
- **farmer**: Farm management access
- **worker**: Limited farm operations
- **viewer**: Read-only access

---

## REST API Endpoints

### Base URL

```
https://your-project.supabase.co/rest/v1
```

### Headers

```http
apikey: <your-anon-key>
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
Prefer: return=minimal
```

### Core Tables

#### Users

```http
GET    /profiles          # Get user profiles
POST   /profiles          # Create user profile
PATCH  /profiles?id=eq{id} # Update user profile
DELETE /profiles?id=eq{id} # Delete user profile
```

#### Farms

```http
GET    /farms             # Get farms (filtered by user access)
POST   /farms             # Create new farm
PATCH  /farms?id=eq{id}   # Update farm
DELETE /farms?id=eq{id}   # Delete farm
```

**Example Response:**

```json
{
  "id": "uuid",
  "name": "Green Valley Farm",
  "description": "Organic vegetable farm",
  "owner_id": "user-uuid",
  "area_hectares": 50,
  "soil_type": "loam",
  "climate_zone": "temperate",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Fields

```http
GET    /fields            # Get fields
POST   /fields            # Create field
PATCH  /fields?id=eq{id}   # Update field
DELETE /fields?id=eq{id}   # Delete field
```

#### Livestock

```http
GET    /livestock         # Get livestock records
POST   /livestock         # Add livestock
PATCH  /livestock?id=eq{id} # Update livestock
DELETE /livestock?id=eq{id} # Delete livestock
```

#### Crops

```http
GET    /crops             # Get crop varieties
POST   /crops             # Add crop variety
PATCH  /crops?id=eq{id}   # Update crop
DELETE /crops?id=eq{id}   # Delete crop
```

#### Crop Plans

```http
GET    /crop_plans        # Get crop planting plans
POST   /crop_plans        # Create crop plan
PATCH  /crop_plans?id=eq{id} # Update crop plan
DELETE /crop_plans?id=eq{id) # Delete crop plan
```

#### Tasks

```http
GET    /tasks             # Get tasks
POST   /tasks             # Create task
PATCH  /tasks?id=eq{id}   # Update task
DELETE /tasks?id=eq{id)   # Delete task
```

#### Equipment

```http
GET    /equipment         # Get equipment
POST   /equipment         # Add equipment
PATCH  /equipment?id=eq{id) # Update equipment
DELETE /equipment?id=eq{id) # Delete equipment
```

#### Inventory

```http
GET    /inventory         # Get inventory items
POST   /inventory         # Add inventory item
PATCH  /inventory?id=eq{id) # Update inventory
DELETE /inventory?id=eq{id) # Delete inventory
```

### Query Parameters

#### Filtering

```http
GET /farms?owner_id=eq.uuid&is_active=eq.true
```

#### Ordering

```http
GET /tasks?created_at=desc&priority=asc
```

#### Pagination

```http
GET /livestock?limit=20&offset=0
```

#### Selecting Columns

```http
GET /farms?select=id,name,area_hectares
```

#### Relationships

```http
GET /farms?select=*,fields(*),livestock(*)
```

---

## Edge Functions

### Base URL

```
https://your-project.supabase.co/functions/v1
```

### Authentication Required

All Edge Functions require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Available Functions

#### AI Insights

```http
POST /ai/insights
Content-Type: application/json

{
  "farm_id": "uuid",
  "insight_type": "crop_recommendation|yield_prediction|risk_assessment",
  "parameters": {
    "field_id": "uuid",
    "crop_type": "corn",
    "season": "spring"
  }
}
```

**Response:**

```json
{
  "insights": [
    {
      "type": "crop_recommendation",
      "recommendation": "Plant corn in Field A based on soil analysis",
      "confidence": 0.85,
      "reasoning": "Soil pH and nitrogen levels are optimal for corn"
    }
  ],
  "generated_at": "2024-01-01T12:00:00Z"
}
```

#### Weather Data

```http
GET /weather?location_id=uuid&days=7
```

**Response:**

```json
{
  "location": {
    "id": "uuid",
    "name": "Main Farm",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "current": {
    "temperature_c": 22,
    "humidity_percent": 65,
    "condition": "partly_cloudy",
    "wind_speed_kmh": 12
  },
  "forecast": [
    {
      "date": "2024-01-02",
      "temperature_min": 15,
      "temperature_max": 25,
      "condition": "sunny",
      "precipitation_mm": 0
    }
  ],
  "recommendations": [
    "Good conditions for field work tomorrow",
    "Consider irrigation for the next 3 days"
  ]
}
```

#### Notifications

```http
GET /notifications?user_id=uuid&is_read=eq.false
POST /notifications
Content-Type: application/json

{
  "user_id": "uuid",
  "type": "warning",
  "title": "Low Inventory Alert",
  "message": "Fertilizer inventory is below minimum level",
  "category": "inventory",
  "priority": "high"
}
```

#### Reports

```http
POST /reports/generate
Content-Type: application/json

{
  "report_type": "farm_summary|crop_performance|livestock_health|financial",
  "farm_id": "uuid",
  "date_range": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "format": "pdf|excel|csv"
}
```

#### Bulk Operations

```http
POST /bulk/operations
Content-Type: application/json

{
  "operation_type": "planting|harvesting|feeding|treatment",
  "items": [
    {
      "field_id": "uuid",
      "crop_id": "uuid",
      "area_hectares": 10,
      "scheduled_date": "2024-01-15"
    }
  ],
  "schedule_immediately": true
}
```

#### Search

```http
POST /search
Content-Type: application/json

{
  "query": "corn planting",
  "filters": {
    "farm_id": "uuid",
    "date_range": "last_30_days"
  },
  "types": ["tasks", "crop_plans", "livestock"]
}
```

---

## Real-time Subscriptions

### WebSocket Connection

```
wss://your-project.supabase.co/realtime/v1/websocket?apikey=<your-anon-key>&token=<your-jwt-token>
```

### Subscription Format

```json
{
  "topic": "schema:table:filter",
  "event": "INSERT|UPDATE|DELETE",
  "schema": "public",
  "table": "livestock",
  "filter": "farm_id=eq.uuid"
}
```

### Example Subscriptions

#### Subscribe to Farm Updates

```javascript
const channel = supabase
  .channel('farm-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'farms',
      filter: `owner_id=eq.${userId}`
    },
    (payload) => {
      console.log('Farm updated:', payload);
    }
  )
  .subscribe();
```

#### Subscribe to Task Changes

```javascript
const channel = supabase
  .channel('task-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `assigned_to=eq.${userId}`
    },
    (payload) => {
      console.log('Task updated:', payload);
    }
  )
  .subscribe();
```

#### Subscribe to Weather Updates

```javascript
const channel = supabase
  .channel('weather-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'weather_data',
      filter: `location_id=eq.${locationId}`
    },
    (payload) => {
      console.log('New weather data:', payload.new);
    }
  )
  .subscribe();
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTH_ERROR` | 401 | Authentication required/invalid |
| `AUTHZ_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_RECORD` | 409 | Record already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `NETWORK_ERROR` | 0 | Connection/network issues |

### Error Handling Best Practices

1. **Always check HTTP status codes** before processing responses
2. **Implement retry logic** for network errors (429, 5xx)
3. **Validate responses** against expected schemas
4. **Log errors** with context for debugging
5. **Provide user-friendly messages** based on error codes

---

## Rate Limiting

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| REST API | 1000 requests | 1 hour |
| Edge Functions | 100 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |
| File uploads | 50 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```javascript
const response = await fetch(url, options);

if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const waitTime = resetTime ? (resetTime * 1000) - Date.now() : 60000;
  
  setTimeout(() => {
    // Retry request
  }, waitTime);
}
```

---

## File Storage

### Base URL

```
https://your-project.supabase.co/storage/v1
```

### Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile images | Public |
| `documents` | Farm documents | Private |
| `images` | General images | Public |
| `videos` | Video files | Public |

### Upload File

```http
POST /storage/v1/object/avatars/user-profile.jpg
Content-Type: multipart/form-data
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="file"; filename="profile.jpg"
Content-Type: image/jpeg

<file-data>
--boundary--
```

### Download File

```http
GET /storage/v1/object/authenticated/documents/farm-plan.pdf
Authorization: Bearer <token>
```

### Get Public URL

```http
GET /storage/v1/object/public/avatars/user-profile.jpg
```

### Delete File

```http
DELETE /storage/v1/object/avatars/user-profile.jpg
Authorization: Bearer <token>
```

---

## Webhooks

### Available Webhooks

#### User Events

- `user.created` - New user registration
- `user.updated` - User profile updated
- `user.deleted` - User account deleted

#### Farm Events

- `farm.created` - New farm created
- `farm.updated` - Farm details updated
- `farm.deleted` - Farm deleted

#### Task Events

- `task.created` - New task created
- `task.completed` - Task marked complete
- `task.overdue` - Task deadline passed

#### Inventory Events

- `inventory.low` - Item below minimum
- `inventory.out` - Item out of stock

### Webhook Configuration

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["task.created", "inventory.low"],
  "secret": "webhook-secret",
  "active": true
}
```

### Webhook Payload Format

```json
{
  "event": "task.created",
  "data": {
    "id": "uuid",
    "title": "Plant corn in Field A",
    "assigned_to": "user-uuid",
    "due_date": "2024-01-15"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "signature": "sha256=hash"
}
```

---

## SDK Integration

### JavaScript/TypeScript

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Database queries
const { data: farms, error } = await supabase
  .from('farms')
  .select('*')
  .eq('owner_id', userId);

// Edge functions
const { data, error } = await supabase.functions.invoke('ai/insights', {
  body: { farm_id: 'uuid', insight_type: 'crop_recommendation' }
});
```

### Python

```python
from supabase import create_client, Client

url = "https://your-project.supabase.co"
key = "your-anon-key"
supabase: Client = create_client(url, key)

# Authentication
auth_response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "password"
})

# Database queries
response = supabase.table("farms").select("*").eq("owner_id", user_id).execute()
```

---

## Testing

### Test Environment

```
https://test-project.supabase.co
```

### Test Credentials

- **Email**: test@example.com
- **Password**: test-password-123
- **API Key**: test-anon-key

### Mock Data

Use the provided test data seeds in `/supabase/init/` for consistent testing.

---

## Support

### Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

### Contact

- **Email**: support@farmers-boot.com
- **GitHub**: https://github.com/farmers-boot/issues
- **Discord**: https://discord.gg/farmers-boot

---

## Changelog

### v2.0.0 (2024-01-01)

- Added AI insights Edge Function
- Implemented real-time weather updates
- Enhanced error handling with standardized codes
- Added bulk operations support
- Improved rate limiting

### v1.5.0 (2023-12-01)

- Added webhook support
- Enhanced file storage capabilities
- Improved search functionality
- Added performance monitoring

### v1.0.0 (2023-10-01)

- Initial API release
- Core CRUD operations
- Authentication system
- Basic real-time subscriptions
