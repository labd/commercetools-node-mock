import inject from 'light-my-request';
import { createExpressApp } from './express-implementation.js';
import { createFastifyApp } from './fastify-implementation.js';

/**
 * Test MSW integration compatibility with both Express and Fastify
 */

async function testMSWIntegration() {
  console.log('Testing MSW Integration Compatibility\n');

  const expressApp = createExpressApp();
  const fastifyApp = createFastifyApp();

  // Test scenarios
  const testCases = [
    {
      method: 'GET',
      url: '/test-project/products',
      description: 'GET collection',
    },
    {
      method: 'POST',
      url: '/test-project/products',
      body: JSON.stringify({ name: 'Test Product' }),
      headers: { 'content-type': 'application/json' },
      description: 'POST create resource',
    },
    {
      method: 'GET',
      url: '/test-project/products/mock-123',
      description: 'GET by ID (404 expected)',
    },
  ];

  console.log('Testing Express app with light-my-request...');
  for (const testCase of testCases) {
    try {
      const response = await inject(expressApp)
        .request({
          method: testCase.method as any,
          url: testCase.url,
          body: testCase.body,
          headers: testCase.headers,
        });
      
      console.log(`  ✅ ${testCase.description}: ${response.statusCode}`);
    } catch (error) {
      console.log(`  ❌ ${testCase.description}: ${error}`);
    }
  }

  console.log('\nTesting Fastify app with light-my-request...');
  for (const testCase of testCases) {
    try {
      const response = await inject(fastifyApp.server)
        .request({
          method: testCase.method as any,
          url: testCase.url,
          body: testCase.body,
          headers: testCase.headers,
        });
      
      console.log(`  ✅ ${testCase.description}: ${response.statusCode}`);
    } catch (error) {
      console.log(`  ❌ ${testCase.description}: ${error}`);
    }
  }

  // Test OAuth endpoints with basic auth
  console.log('\nTesting OAuth endpoints...');
  
  const authHeader = 'Basic ' + Buffer.from('test:test').toString('base64');
  
  try {
    const expressOAuth = await inject(expressApp)
      .post('/oauth/token')
      .headers({ authorization: authHeader })
      .body('grant_type=client_credentials');
    
    console.log(`  ✅ Express OAuth: ${expressOAuth.statusCode}`);
  } catch (error) {
    console.log(`  ❌ Express OAuth: ${error}`);
  }

  try {
    const fastifyOAuth = await inject(fastifyApp.server)
      .post('/oauth/token')
      .headers({ authorization: authHeader })
      .body('grant_type=client_credentials');
    
    console.log(`  ✅ Fastify OAuth: ${fastifyOAuth.statusCode}`);
  } catch (error) {
    console.log(`  ❌ Fastify OAuth: ${error}`);
  }

  console.log('\n✅ MSW integration test completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testMSWIntegration();
}