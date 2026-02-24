/**
 * ============================================================================
 * SUPABASE EDGE FUNCTIONS - MAIN INDEX
 * ============================================================================
 * This file serves as the entry point for all Supabase Edge Functions.
 * It routes requests to the appropriate function handlers with API versioning.
 *
 * API Versioning:
 * - URL-based: /v1/auth, /v2/auth, etc.
 * - Header-based: X-API-Version header
 * - Default version: v1
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './_shared/cors.ts';
import { errorHandler } from './_shared/error-handler.ts';
import {
  extractApiVersion,
  addVersionHeaders,
  API_VERSION,
  type ApiVersion,
} from './_shared/api-versioning.ts';

// Import function handlers
import { handleAuthRequest } from './auth/index.ts';
import { handleFarmsRequest } from './farms/index.ts';
import { handleFieldsRequest } from './fields/index.ts';
import { handleCropsRequest } from './crops/index.ts';
import { handleLivestockRequest } from './livestock/index.ts';
import { handleInventoryRequest } from './inventory/index.ts';
import { handleEquipmentRequest } from './equipment/index.ts';
import { handleTasksRequest } from './tasks/index.ts';
import { handleFinanceRequest } from './finance/index.ts';
import { handleWeatherRequest } from './weather/index.ts';
import { handleNotificationsRequest } from './notifications/index.ts';
import { handleReportsRequest } from './reports/index.ts';
import { handleUploadRequest } from './upload/index.ts';
import { handleWebhooksRequest } from './webhooks/index.ts';
import { handleAIRequest } from './ai/index.ts';
import { handleSearchRequest } from './search/index.ts';
import { handleAuditRequest } from './audit/index.ts';
import { handleLocationsRequest } from './locations/index.ts';

// Route configuration
interface RouteConfig {
  prefix: string;
  handler: (req: Request, version: ApiVersion) => Promise<Response>;
}

const routes: RouteConfig[] = [
  { prefix: '/auth', handler: handleAuthRequest },
  { prefix: '/farms', handler: handleFarmsRequest },
  { prefix: '/fields', handler: handleFieldsRequest },
  { prefix: '/crops', handler: handleCropsRequest },
  { prefix: '/livestock', handler: handleLivestockRequest },
  { prefix: '/inventory', handler: handleInventoryRequest },
  { prefix: '/equipment', handler: handleEquipmentRequest },
  { prefix: '/tasks', handler: handleTasksRequest },
  { prefix: '/finance', handler: handleFinanceRequest },
  { prefix: '/weather', handler: handleWeatherRequest },
  { prefix: '/notifications', handler: handleNotificationsRequest },
  { prefix: '/reports', handler: handleReportsRequest },
  { prefix: '/upload', handler: handleUploadRequest },
  { prefix: '/webhooks', handler: handleWebhooksRequest },
  { prefix: '/ai', handler: handleAIRequest },
  { prefix: '/search', handler: handleSearchRequest },
  { prefix: '/audit', handler: handleAuditRequest },
  { prefix: '/locations', handler: handleLocationsRequest },
];

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Extract API version from URL
    const { version, path } = extractApiVersion(pathname);
    const apiVersion = version || API_VERSION;

    // Route requests to appropriate handlers
    let response: Response | null = null;

    for (const route of routes) {
      if (path.startsWith(route.prefix)) {
        response = await route.handler(req, apiVersion);
        break;
      }
    }

    if (!response) {
      response = new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'The requested endpoint does not exist',
          version: apiVersion,
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Add version headers to all responses
    const responseHeaders = new Headers(response.headers);
    addVersionHeaders(responseHeaders);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return errorHandler(error, req);
  }
});
