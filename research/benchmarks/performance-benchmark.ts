import autocannon from 'autocannon';
import { createExpressApp } from './express-implementation.js';
import { createFastifyApp } from './fastify-implementation.js';

/**
 * Performance benchmark comparing Express vs Fastify implementations
 */

async function runBenchmark(name: string, app: any, port: number) {
  console.log(`\n=== ${name} Benchmark ===`);
  
  // Start server
  const server = await new Promise((resolve, reject) => {
    const srv = app.listen(port, (err?: Error) => {
      if (err) reject(err);
      else resolve(srv);
    });
  });

  try {
    // Test different scenarios
    const scenarios = [
      {
        name: 'GET Collection',
        url: `http://localhost:${port}/test-project/products`,
        method: 'GET',
      },
      {
        name: 'POST Create Resource',
        url: `http://localhost:${port}/test-project/products`,
        method: 'POST',
        body: JSON.stringify({ name: 'Test Product', description: 'A test product' }),
        headers: { 'content-type': 'application/json' },
      },
      {
        name: 'OAuth Token',
        url: `http://localhost:${port}/oauth/token`,
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: { 
          'content-type': 'application/x-www-form-urlencoded',
          'authorization': 'Basic ' + Buffer.from('test:test').toString('base64'),
        },
      },
    ];

    const results = [];

    for (const scenario of scenarios) {
      console.log(`\nTesting: ${scenario.name}`);
      
      const result = await autocannon({
        url: scenario.url,
        method: scenario.method as any,
        body: scenario.body,
        headers: scenario.headers,
        connections: 50,
        duration: 10, // 10 seconds
        pipelining: 1,
      });

      results.push({
        scenario: scenario.name,
        requestsPerSecond: result.requests.average,
        latencyAvg: result.latency.average,
        latency99: result.latency.p99,
        throughput: result.throughput.average,
        errors: result.errors,
      });

      console.log(`  Requests/sec: ${result.requests.average}`);
      console.log(`  Latency avg: ${result.latency.average}ms`);
      console.log(`  Latency p99: ${result.latency.p99}ms`);
      console.log(`  Throughput: ${result.throughput.average} bytes/sec`);
      console.log(`  Errors: ${result.errors}`);
    }

    return results;
  } finally {
    // Close server
    await new Promise((resolve) => {
      (server as any).close(resolve);
    });
  }
}

async function main() {
  console.log('Starting Express vs Fastify Performance Benchmark');
  console.log('============================================');

  try {
    // Benchmark Express
    const expressApp = createExpressApp();
    const expressResults = await runBenchmark('Express', expressApp, 3001);

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Benchmark Fastify
    const fastifyApp = createFastifyApp();
    const fastifyResults = await runBenchmark('Fastify', fastifyApp, 3002);

    // Compare results
    console.log('\n=== Performance Comparison ===');
    console.log('Scenario\t\t\tExpress RPS\tFastify RPS\tFastify vs Express');
    console.log('─'.repeat(80));

    for (let i = 0; i < expressResults.length; i++) {
      const express = expressResults[i];
      const fastify = fastifyResults[i];
      const improvement = ((fastify.requestsPerSecond - express.requestsPerSecond) / express.requestsPerSecond * 100).toFixed(1);
      
      console.log(`${express.scenario.padEnd(24)}\t${express.requestsPerSecond.toFixed(0)}\t\t${fastify.requestsPerSecond.toFixed(0)}\t\t${improvement}%`);
    }

    console.log('\n=== Latency Comparison (avg) ===');
    console.log('Scenario\t\t\tExpress\t\tFastify\t\tImprovement');
    console.log('─'.repeat(80));

    for (let i = 0; i < expressResults.length; i++) {
      const express = expressResults[i];
      const fastify = fastifyResults[i];
      const improvement = ((express.latencyAvg - fastify.latencyAvg) / express.latencyAvg * 100).toFixed(1);
      
      console.log(`${express.scenario.padEnd(24)}\t${express.latencyAvg.toFixed(1)}ms\t\t${fastify.latencyAvg.toFixed(1)}ms\t\t${improvement}%`);
    }

    // Save results to file
    const fs = await import('fs');
    const benchmarkResults = {
      timestamp: new Date().toISOString(),
      express: expressResults,
      fastify: fastifyResults,
      nodejs: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    fs.writeFileSync('/tmp/fastify-research/benchmarks/results.json', JSON.stringify(benchmarkResults, null, 2));
    console.log('\nResults saved to /tmp/fastify-research/benchmarks/results.json');

  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}