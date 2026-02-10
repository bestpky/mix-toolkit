import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, './example'),
  plugins: [react()],
  resolve: {
    alias: {
      '@pky': resolve(__dirname, './packages')
    }
  }
})
