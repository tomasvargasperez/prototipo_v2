import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()], // 👉 Plugin Vue habilitado
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000' // 👉 Redirección al backend
    }
  }
})