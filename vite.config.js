import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // 启用 CSS Modules
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },

  resolve: {
    alias: {
      '@mix-toolkit': resolve(__dirname, './packages')
    }
  }
})
