import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules\/(react|react-dom|scheduler)\//,
              priority: 30,
            },
            {
              name: 'motion-vendor',
              test: /node_modules\/framer-motion\//,
              priority: 25,
            },
            {
              name: 'three-core',
              test: /node_modules\/three\//,
              priority: 20,
            },
            {
              name: 'three-react',
              test: /node_modules\/@react-three\//,
              priority: 15,
            },
          ],
        },
      },
    },
  },
});
