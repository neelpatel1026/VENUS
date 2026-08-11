// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('react-router') || id.includes('react-router-dom') || id.includes('@remix-run')) {
              return 'router';
            }
            if (id.includes('redux') || id.includes('react-redux') || id.includes('@reduxjs')) {
              return 'redux';
            }
            if (id.includes('swiper')) {
              return 'swiper';
            }
            if (id.includes('react-icons') || id.includes('lucide-react')) {
              return 'ui-icons';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})