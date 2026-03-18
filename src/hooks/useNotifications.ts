import { useState, useEffect, useCallback } from 'react';

// VAPID Public Key
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Utility per convertire la chiave VAPID Base64 in Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Recupera i dati dei corsi e delle materie salvati nel localStorage.
 */
function getUserData() {
  return {
    corso: {
      codice: localStorage.getItem('corsoCodice'),
      annoCodice: localStorage.getItem('annoCodice'),
      nome: localStorage.getItem('corsoNome'),
      annoNome: localStorage.getItem('annoNome'),
    },
    materieExtra: JSON.parse(localStorage.getItem('materieExtra') || '[]'),
    blacklist: JSON.parse(localStorage.getItem('blacklist_materie') || '[]'),
  };
}

export const useNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  /**
   * Invia la sottoscrizione e i dati dei corsi al backend.
   */
  const sendSubscriptionToBackend = useCallback(async (sub: PushSubscription) => {
    try {
      const userData = getUserData();
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sub,
          corsi: userData,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'invio della sottoscrizione al backend');
      }

      console.log('Sottoscrizione inviata con successo al backend');
    } catch (error) {
      console.error('Errore di rete durante l\'invio della sottoscrizione:', error);
    }
  }, []);

  /**
   * Registra o recupera il Service Worker e sottoscrive alle notifiche push.
   */
  const subscribeToPush = useCallback(async () => {
    console.log('[PUSH] Inizio subscribeToPush...');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('[PUSH] Browser non supportato');
        throw new Error('Push notifications non supportate da questo browser.');
      }

      console.log('[PUSH] In attesa di navigator.serviceWorker.ready...');
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout attesa Service Worker Ready')), 5000)
      );

      const registration = await Promise.race([swReadyPromise, timeoutPromise]) as ServiceWorkerRegistration;
      console.log('[PUSH] Service Worker pronto');

      let sub = await registration.pushManager.getSubscription();
      console.log('[PUSH] Sottoscrizione esistente:', sub ? 'Sì' : 'No');

      if (!sub) {
        if (!VAPID_PUBLIC_KEY) {
          console.error('[PUSH] Errore: VITE_VAPID_PUBLIC_KEY non è definita nelle variabili d\'ambiente!');
          throw new Error('Chiave VAPID mancante. Controlla il file .env.local e riavvia il server.');
        }
        console.log('[PUSH] Creazione nuova sottoscrizione...');
        const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
        console.log('[PUSH] Sottoscrizione creata!');
      }

      setSubscription(sub);
      await sendSubscriptionToBackend(sub);
      console.log('[PUSH] Fine processo con successo');
      return true;
    } catch (error) {
      console.error('[PUSH] Errore critico:', error);
      return false;
    }
  }, [sendSubscriptionToBackend]);

  /**
   * Annulla la sottoscrizione push sul browser e la rimuove dal database.
   */
  const unsubscribeFromPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        // 1. Chiamata al backend per rimuovere la chiave da Redis
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // 2. Unsubscribe effettivo dal browser
        await sub.unsubscribe();
        setSubscription(null);
      }
      return true;
    } catch (error) {
      console.error('Errore durante l\'annullamento della sottoscrizione:', error);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Questo browser non supporta le notifiche desktop');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      const success = await subscribeToPush();
      if (success) {
        setIsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
      }
      return success;
    } else {
      setIsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      return false;
    }
  }, [subscribeToPush]);

  const toggleNotifications = useCallback(async () => {
    if (!isEnabled) {
      return await requestPermission();
    } else {
      await unsubscribeFromPush();
      setIsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      return true;
    }
  }, [isEnabled, requestPermission, unsubscribeFromPush]);

  // All'avvio, controlla se siamo ancora sottoscritti se le notifiche sono abilitate
  useEffect(() => {
    if (isEnabled && permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            setSubscription(sub);
            // Invia nuovamente per sicurezza in caso i corsi siano cambiati
            sendSubscriptionToBackend(sub);
          } else {
            subscribeToPush();
          }
        });
      });
    }
  }, [isEnabled, permission, subscribeToPush, sendSubscriptionToBackend]);

  return { isEnabled, permission, subscription, requestPermission, toggleNotifications };
};
