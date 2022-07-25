import { defineConfig } from 'tsup'

const commonConfig = {
  clean: true,
  splitting: false,
  dts: true,
  sourcemap: true,
}

export default defineConfig([
  {
    entry: ['src/index.ts'],
    ...commonConfig,
    format: ['cjs', 'esm', 'iife'],
    outDir: 'dist',
  },
])
