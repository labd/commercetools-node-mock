import { build } from 'esbuild';
import { existsSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Bundle size comparison between Express and Fastify implementations
 */

async function analyzeBundle(name: string, entryPoint: string, outputPath: string) {
  console.log(`\nAnalyzing ${name} bundle...`);
  
  try {
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: outputPath,
      format: 'esm',
      metafile: true,
      minify: true,
      treeShaking: true,
      external: [], // Bundle everything to get true size
    });

    const stats = statSync(outputPath);
    
    console.log(`  Output file: ${outputPath}`);
    console.log(`  Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  Bundle size (gzipped estimate): ${(stats.size / 3).toFixed(2)} KB`);

    // Analyze what's in the bundle
    if (result.metafile) {
      const analysis = await import('esbuild').then(m => m.analyzeMetafile(result.metafile!, {
        verbose: false,
      }));
      
      console.log('  Bundle analysis:');
      console.log(analysis);
    }

    return {
      name,
      size: stats.size,
      sizeKB: stats.size / 1024,
      gzippedEstimate: stats.size / 3, // Rough estimate
      metafile: result.metafile,
    };
  } catch (error) {
    console.error(`Failed to analyze ${name}:`, error);
    throw error;
  }
}

async function createTestFiles() {
  // Create simple entry points for bundling
  const expressEntry = `
import { createExpressApp } from './proof-of-concept/express-implementation.js';
const app = createExpressApp();
export { app };
`;

  const fastifyEntry = `
import { createFastifyApp } from './proof-of-concept/fastify-implementation.js';
const app = createFastifyApp();
export { app };
`;

  writeFileSync('/tmp/fastify-research/bundle-analysis/express-entry.js', expressEntry);
  writeFileSync('/tmp/fastify-research/bundle-analysis/fastify-entry.js', fastifyEntry);
}

async function main() {
  console.log('Bundle Size Analysis: Express vs Fastify');
  console.log('=====================================');

  try {
    // Create test entry files
    await createTestFiles();

    // Analyze Express bundle
    const expressResult = await analyzeBundle(
      'Express',
      '/tmp/fastify-research/bundle-analysis/express-entry.js',
      '/tmp/fastify-research/bundle-analysis/express-bundle.js'
    );

    // Analyze Fastify bundle  
    const fastifyResult = await analyzeBundle(
      'Fastify',
      '/tmp/fastify-research/bundle-analysis/fastify-entry.js',
      '/tmp/fastify-research/bundle-analysis/fastify-bundle.js'
    );

    // Compare results
    console.log('\n=== Bundle Size Comparison ===');
    console.log(`Express bundle: ${expressResult.sizeKB.toFixed(2)} KB`);
    console.log(`Fastify bundle: ${fastifyResult.sizeKB.toFixed(2)} KB`);
    
    const sizeDiff = fastifyResult.sizeKB - expressResult.sizeKB;
    const sizeDiffPercent = (sizeDiff / expressResult.sizeKB * 100).toFixed(1);
    
    console.log(`Difference: ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(2)} KB (${sizeDiffPercent}%)`);
    
    if (sizeDiff > 0) {
      console.log('❌ Fastify bundle is larger');
    } else {
      console.log('✅ Fastify bundle is smaller');
    }

    // Save analysis results
    const analysis = {
      timestamp: new Date().toISOString(),
      express: expressResult,
      fastify: fastifyResult,
      comparison: {
        sizeDifferenceKB: sizeDiff,
        sizeDifferencePercent: sizeDiffPercent,
        winner: sizeDiff <= 0 ? 'fastify' : 'express',
      },
    };

    writeFileSync('/tmp/fastify-research/bundle-analysis/analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\nAnalysis saved to /tmp/fastify-research/bundle-analysis/analysis.json');

  } catch (error) {
    console.error('Bundle analysis failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}