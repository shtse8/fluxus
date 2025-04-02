/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue'; // Import the Vue plugin

export default defineConfig({
  plugins: [vue()], // Add the Vue plugin
  test: {
    globals: true, // Use Vitest globals (describe, it, expect)
    environment: 'jsdom', // Use jsdom for simulating browser environment
    setupFiles: ['./vitest.setup.ts'], // Run setup file before tests
    // Optional: Include files matching a pattern
    // include: ['src/**/*.test.ts', 'react-adapter/**/*.test.tsx', 'vue-adapter/**/*.test.ts'],
  },
});
