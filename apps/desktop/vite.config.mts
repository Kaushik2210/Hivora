import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const root = path.resolve(__dirname, '../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hivora/ui': path.resolve(root, 'packages/ui/src/index.ts'),
      '@hivora/shared/brand': path.resolve(root, 'packages/shared/src/brand.ts'),
      '@hivora/shared/sdk': path.resolve(root, 'packages/shared/src/sdk/index.ts'),
      '@hivora/shared': path.resolve(root, 'packages/shared/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@hivora/ui', '@hivora/shared', '@hivora/shared/brand', '@hivora/shared/sdk'],
  },
})
