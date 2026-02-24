import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';
import path from 'path';

// Plugin to fix chrome-extension:// URL issues
const fixChromeExtensionPlugin = (): Plugin => ({
  name: 'fix-chrome-extension',
  configureServer(server) {
    // Add middleware to handle chrome-extension URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url && req.url.includes('chrome-extension://')) {
        console.warn('Blocked chrome-extension URL:', req.url);
        // Don't rewrite - just block to prevent infinite loops
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      next();
    });
  },
  // Also handle during build
  resolveId(id) {
    if (id.includes('chrome-extension://')) {
      return null;
    }
  },
});

// Supabase local development URL
const SUPABASE_LOCAL_URL = 'http://localhost:54321';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mui/material/Unstable_Grid2': '@mui/material/Unstable_Grid2',
    },
  },
  plugins: [
    fixChromeExtensionPlugin(),
    react({
      jsxRuntime: 'automatic',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB to handle large bundles
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: /\/(rest|auth|functions)\/v1\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(rest|auth|functions)\/v1\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Enable minification with terser for better tree-shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        // Remove pure functions
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        // Remove comments
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Optimized chunk splitting strategy
        manualChunks: id => {
          // Vendor chunk - React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // Router chunk
          if (id.includes('node_modules/react-router-dom/')) {
            return 'router';
          }

          // UI libraries - split by library
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }

          if (id.includes('node_modules/@mui/')) {
            // Split MUI into smaller chunks
            if (id.includes('@mui/material')) {
              return 'mui-material';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@mui/x-data-grid')) {
              return 'mui-data-grid';
            }
            if (id.includes('@mui/x-date-pickers')) {
              return 'mui-date-pickers';
            }
            return 'mui-other';
          }

          // Maps - large library, separate chunk
          if (id.includes('node_modules/mapbox-gl/')) {
            return 'mapbox';
          }

          // Charts
          if (id.includes('node_modules/recharts/')) {
            return 'charts';
          }

          // Query/TanStack
          if (id.includes('node_modules/@tanstack/')) {
            return 'tanstack';
          }

          // Utilities
          if (
            id.includes('node_modules/date-fns/') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')
          ) {
            return 'utils';
          }

          // Validation
          if (id.includes('node_modules/zod/')) {
            return 'validation';
          }

          // Icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons';
          }

          // State management
          if (id.includes('node_modules/zustand/')) {
            return 'state';
          }

          // Database/Offline
          if (id.includes('node_modules/dexie/')) {
            return 'database';
          }

          // Drag and drop
          if (id.includes('node_modules/@hello-pangea/dnd/')) {
            return 'dnd';
          }

          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }

          // Sentry
          if (id.includes('node_modules/@sentry/')) {
            return 'sentry';
          }

          // Other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 5000,
    host: 'localhost',
    strictPort: false,
    fs: {
      strict: true,
    },
    proxy: {
      '/auth/v1': {
        target: SUPABASE_LOCAL_URL,
        changeOrigin: true,
      },
      '/rest/v1': {
        target: SUPABASE_LOCAL_URL,
        changeOrigin: true,
      },
      '/functions/v1': {
        target: SUPABASE_LOCAL_URL,
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    },
  },
  optimizeDeps: {
    exclude: ['@vite/client', '@vite/env'],
    // Include commonly used dependencies for pre-bundling
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'date-fns',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
  },
  preview: {
    port: 5173,
    strictPort: true,
    // Add proper headers for SPA routing
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  },
});
