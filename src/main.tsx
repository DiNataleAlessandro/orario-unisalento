import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Registrazione automatica del Service Worker per la PWA
registerSW({
  onOfflineReady() {
    console.log('App pronta per l\'uso offline.');
  },
  onNeedRefresh() {
    console.log('Nuovo contenuto disponibile, ricaricare la pagina.');
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
