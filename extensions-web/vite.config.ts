import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'JanExtensionsWeb',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['@miaoda/core', 'zustand']
    },
    emptyOutDir: false // Don't clean the output directory
  },
  define: {
    JAN_API_BASE: JSON.stringify(process.env.JAN_API_BASE || 'https://api-dev.jan.ai/jan/v1'),
  }
})