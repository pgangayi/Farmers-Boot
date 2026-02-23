#!/usr/bin/env node

// Test Supabase Keys Script
// - Reads environment variables from process.env and .env files
// - Tests SUPABASE_URL reachability
// - Verifies SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (and VITE variants)
// - Prints a concise report

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDotEnv(content) {
  const result = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  });
  return result;
}

function loadEnvFiles() {
  const candidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', 'apps', 'api', '.env'),
    path.resolve(__dirname, '..', 'apps', 'web', '.env'),
  ];

  const env = { ...(process.env || {}) };

  for (const file of candidates) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const parsed = parseDotEnv(content);
      Object.assign(env, parsed);
    } catch (err) {
      // ignore missing files
    }
  }

  return env;
}

async function fetchWithTimeout(url, opts = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    return res;
  } catch (err) {
    throw err;
  } finally {
    clearTimeout(id);
  }
}

function normalizeUrl(u) {
  if (!u) return '';
  return u.replace(/\/+$/, '');
}

function isJWT(val) {
  // crude check for JWT format (three base64 parts separated by dots)
  return typeof val === 'string' && val.split('.').length === 3;
}

function short(v) {
  if (!v) return '';
  return v.length > 40 ? v.slice(0, 20) + '...' + v.slice(-10) : v;
}

async function testUrlReachable(url) {
  try {
    const res = await fetchWithTimeout(url, { method: 'GET' }, 3000);
    return { ok: true, status: res.status, statusText: res.statusText };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function testKeyAgainstRest(supabaseUrl, key) {
  const restUrl = `${normalizeUrl(supabaseUrl)}/rest/v1/`;
  try {
    const res = await fetchWithTimeout(
      restUrl,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          Accept: 'application/json',
        },
      },
      5000
    );

    return { status: res.status, ok: res.ok, statusText: res.statusText };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

async function testServiceRoleAdminEndpoint(supabaseUrl, key) {
  const adminUsers = `${normalizeUrl(supabaseUrl)}/auth/v1/admin/users`;
  try {
    const res = await fetchWithTimeout(
      adminUsers,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
          Accept: 'application/json',
        },
      },
      5000
    );
    return { status: res.status, ok: res.ok, statusText: res.statusText };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

async function run() {
  console.log('\n🔧 Supabase Keys Tester');
  console.log('='.repeat(60));

  const env = loadEnvFiles();

  const candidates = {
    SUPABASE_URL:
      env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.supabaseUrl || env.vite_supabase_url || '',
    SUPABASE_ANON_KEY:
      env.SUPABASE_ANON_KEY ||
      env.VITE_SUPABASE_ANON_KEY ||
      env.supabaseAnonKey ||
      env.vite_supabase_anon_key ||
      '',
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || env.supabaseServiceRoleKey || '',
  };

  const url = normalizeUrl(candidates.SUPABASE_URL);

  if (!url) {
    console.log('❌ No SUPABASE_URL found (looked for SUPABASE_URL / VITE_SUPABASE_URL).');
    process.exitCode = 2;
    return;
  }

  console.log(`Project URL: ${url}`);

  const reach = await testUrlReachable(url);
  if (!reach.ok) {
    console.log(`❌ Supabase URL unreachable: ${reach.error}`);
    process.exitCode = 2;
    return;
  }
  console.log(`✅ Supabase URL reachable (status ${reach.status} ${reach.statusText})`);

  const reports = [];

  // Check anon key
  if (candidates.SUPABASE_ANON_KEY) {
    console.log(`\n🔑 Testing SUPABASE_ANON_KEY (${short(candidates.SUPABASE_ANON_KEY)})`);
    const res = await testKeyAgainstRest(url, candidates.SUPABASE_ANON_KEY);
    if (res.error) {
      console.log(`   ❌ Network error: ${res.error}`);
      reports.push({ key: 'anon', ok: false, reason: res.error });
    } else if (res.status >= 200 && res.status < 300) {
      console.log(`   ✅ Key accepted by REST endpoint (status ${res.status})`);
      reports.push({ key: 'anon', ok: true, reason: `status ${res.status}` });
    } else if (res.status === 401) {
      console.log('   ❌ Unauthorized (401) — anon key likely invalid');
      reports.push({ key: 'anon', ok: false, reason: '401 Unauthorized' });
    } else if (res.status === 403) {
      console.log('   ⚠️  Forbidden (403) — key is recognized but access denied');
      reports.push({ key: 'anon', ok: false, reason: '403 Forbidden' });
    } else {
      console.log(`   ℹ️  Received status ${res.status} ${res.statusText}`);
      reports.push({
        key: 'anon',
        ok: res.status >= 200 && res.status < 500,
        reason: `status ${res.status}`,
      });
    }
  } else {
    console.log('\n⚠️  SUPABASE_ANON_KEY not found in env');
    reports.push({ key: 'anon', ok: false, reason: 'missing' });
  }

  // Check service role
  if (candidates.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      `\n🔑 Testing SUPABASE_SERVICE_ROLE_KEY (${short(candidates.SUPABASE_SERVICE_ROLE_KEY)})`
    );

    // Format check
    if (isJWT(candidates.SUPABASE_SERVICE_ROLE_KEY)) {
      console.log('   ✓ Looks like a JWT (service role key format)');
    } else {
      console.log('   ⚠️  Does not look like a JWT');
    }

    const res = await testServiceRoleAdminEndpoint(url, candidates.SUPABASE_SERVICE_ROLE_KEY);
    if (res.error) {
      console.log(`   ❌ Network error: ${res.error}`);
      reports.push({ key: 'service', ok: false, reason: res.error });
    } else if (res.status >= 200 && res.status < 300) {
      console.log(`   ✅ Service role key accepted by admin endpoint (status ${res.status})`);
      reports.push({ key: 'service', ok: true, reason: `status ${res.status}` });
    } else if (res.status === 401) {
      console.log('   ❌ Unauthorized (401) — service key invalid or revoked');
      reports.push({ key: 'service', ok: false, reason: '401 Unauthorized' });
    } else if (res.status === 403) {
      console.log('   ⚠️  Forbidden (403) — access denied');
      reports.push({ key: 'service', ok: false, reason: '403 Forbidden' });
    } else {
      console.log(`   ℹ️  Received status ${res.status} ${res.statusText}`);
      reports.push({
        key: 'service',
        ok: res.status >= 200 && res.status < 500,
        reason: `status ${res.status}`,
      });
    }
  } else {
    console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY not found in env');
    reports.push({ key: 'service', ok: false, reason: 'missing' });
  }

  console.log('\n📊 Summary');
  console.log('='.repeat(60));
  reports.forEach((r) => {
    const label = r.key === 'anon' ? 'Anon Key' : 'Service Role Key';
    const status = r.ok ? '✅ VALID' : '❌ INVALID';
    console.log(`${status} - ${label} - ${r.reason}`);
  });

  const allOk = reports.every((r) => r.ok === true);
  if (allOk) {
    console.log('\n🎉 All Supabase keys look valid.');
    process.exitCode = 0;
  } else {
    console.log(
      '\n⚠️ One or more keys are missing/invalid. Please check .env and your Supabase project.'
    );
    process.exitCode = 3;
  }
}

// Run when executed directly (works on Windows and Unix)
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { run };
