/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'NextLesson Unisalento',
        short_name: 'NextLesson',
        description: 'La tua prossima lezione, a portata di mano',
        theme_color: '#121212', 
        background_color: '#121212', 
        display: 'standalone', 
        orientation: 'portrait',
        start_url: '/',  
        scope: '/',      
        icons: [
          {
            src: '/icona.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    host: true,
    watch: {
      ignored: [path.resolve(__dirname, 'api')]
    },
    proxy: {
      '/api-unisalento': {
        target: 'https://logistica.unisalento.it',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-unisalento/, '')
      }
    }
  }
})
