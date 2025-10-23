import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for React
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
