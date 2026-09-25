import { defineConfig } from 'vitest/config'

// Unit tests for pure logic (certificates, grading, guardian links, API errors).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
