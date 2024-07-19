import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'seatMaps',
      fileName: () => `bundle.js`,
      
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'lodash.union', 'lodash.pick'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lodash.union': 'union',
          'lodash.pick': 'pick',
        },
      },
    },
  },
  server: {
    cors: true,
  },
});
