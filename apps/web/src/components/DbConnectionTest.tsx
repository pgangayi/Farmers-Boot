import { useState, useEffect } from 'react';
import { testDbConnection } from '@/utils/test-db-connection';

export function DbConnectionTest() {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    const testResult = await testDbConnection();
    setResult(testResult);
    setLoading(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Database Connection Test</h2>
      {loading && <p>Testing connection...</p>}
      {result && (
        <div
          className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          <p className="font-medium">{result.success ? '✅ Success' : '❌ Failed'}</p>
          <p className="text-sm">{result.message}</p>
        </div>
      )}
      <button
        onClick={runTest}
        disabled={loading}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Again'}
      </button>
    </div>
  );
}
