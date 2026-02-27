/* eslint-env node */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

function requireEnv(key) {
  const v = process.env[key];
  if (v == null || v === '') {
    throw new Error(`environment variable ${key} is required`);
  }
  return v;
}

// ports can still have sensible defaults for local development, but we
// encourage setting them explicitly in a `.env` file and loading via
// node (e.g. using dotenv) before starting this script.
const FRONTEND_PORT = process.env.FRONTEND_PORT || process.env.PORT || 5000;
const BACKEND_PORT = process.env.BACKEND_PORT || 5757;
const isProduction = process.env.NODE_ENV === 'production';

// Backend service URLs are mandatory because the proxy depends on them.
const KONG_URL = requireEnv('KONG_URL');
const FUNCTIONS_URL = requireEnv('FUNCTIONS_URL'); // local edge runtime default should be set explicitly

// Security headers middleware
app.use((req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Security headers for production
  if (isProduction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com; " +
        "worker-src 'self' blob:;"
    );
  }
  next();
});

// Proxy PostgREST API requests
app.use(
  '/rest/v1',
  createProxyMiddleware({
    target: KONG_URL,
    changeOrigin: true,
  })
);

// Proxy Edge Functions
app.use(
  '/functions/v1',
  createProxyMiddleware({
    target: FUNCTIONS_URL,
    changeOrigin: true,
  })
);

// Proxy Auth requests if needed
app.use(
  '/auth/v1',
  createProxyMiddleware({
    target: KONG_URL,
    changeOrigin: true,
  })
);

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - send all non-API routes to index.html
// Use a RegExp route to avoid path-to-regexp parsing issues ("*" can break some versions)
app.get(/.*/, (req, res) => {
  // Skip API routes
  if (
    req.path.startsWith('/rest/v1') ||
    req.path.startsWith('/functions/v1') ||
    req.path.startsWith('/auth/v1')
  ) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // If an E2E session file exists, inject a small script into index.html
  const sessionPath = join(__dirname, '..', '.e2e_session.json');
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(sessionPath)) {
    try {
      const indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });
      const sessionRaw = fs.readFileSync(sessionPath, { encoding: 'utf8' });
      // Build injection script that sets localStorage before the app bootstraps
      const injectionScript = `\n<script>\n  try {\n    const s = ${sessionRaw};\n    if (s.token) { window.localStorage.setItem('auth_token', s.token); }\n    if (s.user) { window.localStorage.setItem('current_user', JSON.stringify(s.user)); }\n  } catch (e) { console.error('Failed to inject E2E session', e); }\n</script>\n`;
      // Optionally inject a CSRF meta tag if session contains csrfToken
      let final = indexHtml;
      try {
        const parsed = JSON.parse(sessionRaw || '{}');
        const csrf = parsed.csrfToken;
        if (csrf) {
          const meta = `\n<meta name="csrf-token" content=${JSON.stringify(csrf)} />\n`;
          final = final.includes('</head>')
            ? final.replace('</head>', `${meta}</head>`)
            : meta + final;
        }
      } catch (e) {
        // ignore parse errors
      }

      // Insert script inside <head> so it runs before the main bundle executes
      final = final.includes('</head>')
        ? final.replace('</head>', `${injectionScript}</head>`)
        : injectionScript + final;
      res.setHeader('Content-Type', 'text/html');
      return res.send(final);
    } catch (e) {
      console.error('Error injecting E2E session:', e);
      // fallback to sending the file
      return res.sendFile(indexPath);
    }
  }

  // Send index.html for all other routes
  res.sendFile(indexPath);
});

app.listen(FRONTEND_PORT, () => {
  console.log(`🚀 Preview server running at http://localhost:${FRONTEND_PORT}`);
  console.log(`📱 SPA routing enabled for all routes`);
  console.log(`🔁 Proxying /rest/v1, /auth/v1 to ${KONG_URL}`);
  console.log(`🔁 Proxying /functions/v1 to ${FUNCTIONS_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down preview server...');
  process.exit(0);
});
