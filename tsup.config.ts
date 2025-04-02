import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts', // Core library entry point
    react: 'react/index.ts', // React adapter entry point
  },
  format: ['cjs', 'esm'], // Output both CommonJS and ES module formats
  dts: true, // Generate declaration files (.d.ts)
  sourcemap: true, // Generate source maps
  splitting: true, // Enable code splitting for better tree-shaking
  clean: true, // Clean the output directory before each build
  target: 'es2020', // Target modern JavaScript environment
  outDir: 'dist', // Output directory
  // Consider adding 'minify: true' for production builds later
});