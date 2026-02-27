#!/usr/bin/env node

// Migration Test Script
// Tests the Supabase migration and KV session management

import { SupabaseDatabaseOperations } from '../backend/src/lib/supabase-db.js';
import { KVSessionManager } from '../backend/src/lib/kv-session.js';

// Test configuration (required values)
import { requireEnv } from './env.mjs';

const TEST_CONFIG = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  testUserId: 'test-user-migration',
};

// Mock environment for testing
const createMockEnv = (config) => ({
  SUPABASE_URL: config.supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: config.supabaseKey,
  ENVIRONMENT: 'development',
  SESSIONS_KV: {
    get: async (key) => {
      console.log(`[KV Mock] GET: ${key}`);
      return null;
    },
    put: async (key, value, options) => {
      console.log(`[KV Mock] PUT: ${key}`, options);
      return true;
    },
    delete: async (key) => {
      console.log(`[KV Mock] DELETE: ${key}`);
      return true;
    },
    list: async (options) => {
      console.log(`[KV Mock] LIST:`, options);
      return { keys: [] };
    },
  },
});

// Test functions
async function testSupabaseConnection(env) {
  console.log('\n🔍 Testing Supabase Connection...');

  try {
    const db = new SupabaseDatabaseOperations(env);
    const healthCheck = await db.healthCheck();

    if (healthCheck.success) {
      console.log('✅ Supabase connection successful');
      console.log(`   Response time: ${healthCheck.duration}ms`);
      return true;
    } else {
      console.log('❌ Supabase connection failed');
      console.log(`   Error: ${healthCheck.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function testDatabaseOperations(env) {
  console.log('\n🔍 Testing Database Operations...');

  try {
    const db = new SupabaseDatabaseOperations(env);

    // Test table existence
    const tables = ['users', 'farms', 'crops', 'animals', 'tasks'];
    let allTablesExist = true;

    for (const table of tables) {
      try {
        const result = await db.executeQuery(table, 'select', {
          columns: 'id',
          limit: 1,
        });
        console.log(`✅ Table '${table}' accessible`);
      } catch (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
        allTablesExist = false;
      }
    }

    return allTablesExist;
  } catch (error) {
    console.log('❌ Database operations error:', error.message);
    return false;
  }
}

async function testSessionManagement(env) {
  console.log('\n🔍 Testing KV Session Management...');

  try {
    const sessionManager = new KVSessionManager(env);

    // Test session creation
    const session = await sessionManager.createSession(
      TEST_CONFIG.testUserId,
      { name: 'Test User', role: 'admin' },
      { ipAddress: '127.0.0.1', userAgent: 'test-script' }
    );

    console.log('✅ Session creation successful');
    console.log(`   Session ID: ${session.sessionId.substring(0, 8)}...`);

    // Test session retrieval
    const retrievedSession = await sessionManager.getSession(session.sessionId);

    if (retrievedSession && retrievedSession.userId === TEST_CONFIG.testUserId) {
      console.log('✅ Session retrieval successful');
    } else {
      console.log('❌ Session retrieval failed');
      return false;
    }

    // Test session deletion
    const deleted = await sessionManager.deleteSession(session.sessionId);

    if (deleted) {
      console.log('✅ Session deletion successful');
    } else {
      console.log('❌ Session deletion failed');
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Session management error:', error.message);
    return false;
  }
}

async function testAPIEndpoint(env) {
  console.log('\n🔍 Testing API Endpoint...');

  try {
    // Import the crops API handler
    const { handleCropsRequest } = await import('../backend/api/crops-supabase.js');

    // Create a mock request
    const mockRequest = {
      url: 'https://farmers-boot.workers.dev/api/crops',
      method: 'GET',
      headers: new Map([
        ['Cookie', `farmers_session=test-session-${Date.now()}`],
        ['Content-Type', 'application/json'],
      ]),
    };

    // Mock response and context
    const mockResponse = {
      status: 200,
      headers: new Map(),
      body: null,
    };

    const mockCtx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    };

    // Test the endpoint (this will likely fail without proper session)
    try {
      await handleCropsRequest(mockRequest, env, mockCtx);
      console.log('✅ API endpoint handler executed');
      return true;
    } catch (error) {
      if (error.message.includes('Authentication required')) {
        console.log('✅ API endpoint authentication working');
        return true;
      } else {
        console.log('❌ API endpoint error:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ API endpoint import error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Migration Tests');
  console.log('='.repeat(50));

  // environment already validated when constructing TEST_CONFIG

  const env = createMockEnv(TEST_CONFIG);

  // Run tests
  const results = {
    supabaseConnection: await testSupabaseConnection(env),
    databaseOperations: await testDatabaseOperations(env),
    sessionManagement: await testSessionManagement(env),
    apiEndpoint: await testAPIEndpoint(env),
  };

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Migration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before proceeding.');
  }

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export {
  runTests,
  testSupabaseConnection,
  testDatabaseOperations,
  testSessionManagement,
  testAPIEndpoint,
};
