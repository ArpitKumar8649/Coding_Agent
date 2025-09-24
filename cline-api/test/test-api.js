const http = require('http');

const API_BASE = `http://localhost:${process.env.PORT || 3000}`;
const API_KEY = process.env.API_KEY || 'test-api-key';

// Helper function to make HTTP requests
const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, body: jsonBody, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test suite
async function runTests() {
  console.log('🧪 Running Cline API Tests\n');
  
  let passed = 0;
  let failed = 0;

  const test = async (name, testFn) => {
    try {
      console.log(`⏳ Testing: ${name}`);
      await testFn();
      console.log(`✅ PASS: ${name}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  };

  // Test 1: Health check
  await test('Health Check', async () => {
    const response = await makeRequest('/health');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (response.body.status !== 'ok') throw new Error('Health check failed');
  });

  // Test 2: Root endpoint
  await test('Root Endpoint', async () => {
    const response = await makeRequest('/');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.message) throw new Error('Missing message in root response');
  });

  // Test 3: Generate endpoint (mock test - no real LLM)
  await test('Generate Code Validation', async () => {
    const response = await makeRequest('/api/generate', 'POST', {
      // Invalid request - missing prompt
    });
    if (response.status !== 400) throw new Error(`Expected 400 for invalid request, got ${response.status}`);
  });

  // Test 4: Edit endpoint validation
  await test('Edit Code Validation', async () => {
    const response = await makeRequest('/api/edit', 'POST', {
      content: 'console.log("hello");',
      // Missing instructions
    });
    if (response.status !== 400) throw new Error(`Expected 400 for invalid request, got ${response.status}`);
  });

  // Test 5: Diff endpoint
  await test('Diff Generation', async () => {
    const response = await makeRequest('/api/diff', 'POST', {
      originalContent: 'console.log("hello");',
      newContent: 'console.log("hello world");',
      filePath: 'test.js'
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.body.success) throw new Error('Diff generation failed');
    if (!response.body.files || response.body.files.length === 0) throw new Error('No diff files returned');
  });

  // Test 6: Authentication
  await test('Authentication Required', async () => {
    const requestWithoutAuth = (path, method = 'GET', data = null) => {
      return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
          method,
          headers: { 'Content-Type': 'application/json' }
          // No Authorization header
        };

        const req = http.request(url, options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const jsonBody = JSON.parse(body);
              resolve({ status: res.statusCode, body: jsonBody });
            } catch {
              resolve({ status: res.statusCode, body });
            }
          });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
      });
    };

    // Only test auth if API_KEY is set and we're not in development without API key
    if (API_KEY && API_KEY !== 'test-api-key') {
      const response = await requestWithoutAuth('/api/generate', 'POST', { prompt: 'test' });
      if (response.status !== 401) throw new Error(`Expected 401 for missing auth, got ${response.status}`);
    }
  });

  // Summary
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Check if server is running first
const checkServer = async () => {
  try {
    await makeRequest('/health');
    console.log('✅ Server is running, starting tests...\n');
    await runTests();
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('   Please start the server first: npm start');
    process.exit(1);
  }
};

checkServer();