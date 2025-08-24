import { createExpressApp } from './express-implementation.js';
import { createFastifyApp } from './fastify-implementation.js';

/**
 * Simple smoke test to verify both implementations work
 */

async function testExpress() {
  console.log('Testing Express implementation...');
  
  const app = createExpressApp();
  
  return new Promise((resolve, reject) => {
    const server = app.listen(3001, () => {
      console.log('✅ Express app started successfully');
      server.close(() => {
        console.log('✅ Express app stopped successfully');
        resolve(true);
      });
    });
    
    setTimeout(() => {
      reject(new Error('Express app failed to start within timeout'));
    }, 5000);
  });
}

async function testFastify() {
  console.log('Testing Fastify implementation...');
  
  const app = createFastifyApp();
  
  try {
    await app.listen({ port: 3002 });
    console.log('✅ Fastify app started successfully');
    
    await app.close();
    console.log('✅ Fastify app stopped successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Fastify app failed:', error);
    throw error;
  }
}

async function main() {
  console.log('Running smoke tests for both implementations\n');
  
  try {
    await testExpress();
    console.log();
    await testFastify();
    
    console.log('\n🎉 Both implementations work correctly!');
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}