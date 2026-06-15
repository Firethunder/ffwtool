import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/ffwtool/',
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  }
})
