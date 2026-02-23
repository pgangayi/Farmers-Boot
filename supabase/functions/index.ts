/**
 * ============================================================================
 * SUPABASE EDGE FUNCTIONS - MAIN INDEX
 * ============================================================================
 * This file serves as the entry point for all Supabase Edge Functions.
 * It routes requests to the appropriate function handlers.
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './_shared/cors.ts';
import { errorHandler } from './_shared/error-handler.ts';

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

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Route requests to appropriate handlers
    let response;

    if (path.startsWith('/auth/')) {
      response = await handleAuthRequest(req);
    } else if (path.startsWith('/farms/')) {
      response = await handleFarmsRequest(req);
    } else if (path.startsWith('/fields/')) {
      response = await handleFieldsRequest(req);
    } else if (path.startsWith('/crops/')) {
      response = await handleCropsRequest(req);
    } else if (path.startsWith('/livestock/')) {
      response = await handleLivestockRequest(req);
    } else if (path.startsWith('/inventory/')) {
      response = await handleInventoryRequest(req);
    } else if (path.startsWith('/equipment/')) {
      response = await handleEquipmentRequest(req);
    } else if (path.startsWith('/tasks/')) {
      response = await handleTasksRequest(req);
    } else if (path.startsWith('/finance/')) {
      response = await handleFinanceRequest(req);
    } else if (path.startsWith('/weather/')) {
      response = await handleWeatherRequest(req);
    } else if (path.startsWith('/notifications/')) {
      response = await handleNotificationsRequest(req);
    } else if (path.startsWith('/reports/')) {
      response = await handleReportsRequest(req);
    } else if (path.startsWith('/upload/')) {
      response = await handleUploadRequest(req);
    } else if (path.startsWith('/webhooks/')) {
      response = await handleWebhooksRequest(req);
    } else if (path.startsWith('/ai/')) {
      response = await handleAIRequest(req);
    } else if (path.startsWith('/search/')) {
      response = await handleSearchRequest(req);
    } else if (path.startsWith('/audit/')) {
      response = await handleAuditRequest(req);
    } else if (path.startsWith('/locations/')) {
      response = await handleLocationsRequest(req);
    } else {
      response = new Response(
        JSON.stringify({ error: 'Not Found', message: 'The requested endpoint does not exist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return response;
  } catch (error) {
    return errorHandler(error, req);
  }
});
