import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as any],
  test: {
    name: 'web',
    environment: 'jsdom',
    globals: true,
  },
});
