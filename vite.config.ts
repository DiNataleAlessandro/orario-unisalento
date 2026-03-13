import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Salva in memoria questi file per far funzionare l'app velocemente
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Orario Unisalento',
        short_name: 'OrarioUni',
        description: 'La tua agenda intelligente per le lezioni',
        theme_color: '#2563eb', // Il colore blu della nostra app
        background_color: '#f9fafb',
        display: 'standalone', // Fa sparire la barra di Safari!
        orientation: 'portrait',
        start_url: '/',  // <-- MAGIA APPLE 1: Il recinto inizia dalla root
        scope: '/',      // <-- MAGIA APPLE 2: Il recinto vale per tutte le pagine
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
})