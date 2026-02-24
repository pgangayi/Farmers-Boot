/**
 * ============================================================================
 * API VERSIONING UTILITIES
 * ============================================================================
 * Provides API versioning support for Supabase Edge Functions.
 * Supports URL-based versioning: /v1/auth, /v2/auth, etc.
 * ============================================================================
 */

// Current API version
export const API_VERSION = 'v1';
export const API_VERSIONS = ['v1'] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];

// Version header for responses
export const VERSION_HEADERS = {
  'X-API-Version': API_VERSION,
  'X-API-Deprecated': 'false',
};

/**
 * Extract API version from URL path
 */
export function extractApiVersion(pathname: string): { version: ApiVersion | null; path: string } {
  const segments = pathname.split('/').filter(Boolean);

  // Check if first segment is a version
  const firstSegment = segments[0];
  if (firstSegment && API_VERSIONS.includes(firstSegment as ApiVersion)) {
    return {
      version: firstSegment as ApiVersion,
      path: '/' + segments.slice(1).join('/'),
    };
  }

  // No version in URL, use default
  return {
    version: null,
    path: pathname,
  };
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(headers: Headers): void {
  headers.set('X-API-Version', API_VERSION);
  headers.set('X-API-Supported-Versions', API_VERSIONS.join(', '));
}

/**
 * Create versioned response wrapper
 */
export function createVersionedResponse<T>(
  data: T,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...VERSION_HEADERS,
    ...additionalHeaders,
  });

  addVersionHeaders(headers);

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Deprecation warning for old API versions
 */
export interface DeprecationInfo {
  version: string;
  sunset?: string;
  link?: string;
}

export function addDeprecationHeaders(headers: Headers, deprecation: DeprecationInfo): void {
  headers.set('X-API-Deprecated', 'true');
  headers.set('X-API-Deprecation-Version', deprecation.version);

  if (deprecation.sunset) {
    headers.set('X-API-Sunset', deprecation.sunset);
  }

  if (deprecation.link) {
    headers.set('Link', `<${deprecation.link}>; rel="deprecation"`);
  }
}

/**
 * Version negotiation helper
 */
export function negotiateVersion(acceptVersion?: string | null): ApiVersion {
  if (!acceptVersion) {
    return API_VERSION;
  }

  // Check if requested version is supported
  if (API_VERSIONS.includes(acceptVersion as ApiVersion)) {
    return acceptVersion as ApiVersion;
  }

  // Return current version as fallback
  return API_VERSION;
}

/**
 * API version middleware for request handling
 */
export function withVersioning(
  handler: (req: Request, version: ApiVersion) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const url = new URL(req.url);
    const { version, path } = extractApiVersion(url.pathname);

    // Use negotiated version or default
    const apiVersion =
      version ||
      negotiateVersion(req.headers.get('X-API-Version') || url.searchParams.get('api_version'));

    // Create new request with version-stripped path
    const versionedUrl = new URL(url);
    versionedUrl.pathname = path;
    const versionedRequest = new Request(versionedUrl, req);

    // Call handler with version
    const response = await handler(versionedRequest, apiVersion);

    // Add version headers to response
    const newHeaders = new Headers(response.headers);
    addVersionHeaders(newHeaders);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
