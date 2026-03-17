import { useState, useEffect, useCallback } from 'react';
import type { Lezione } from '@/types/lezione';
import { cleanHtmlTags } from '@/api/transformers';

export const useNotifications = (lezioni: Lezione[]) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Questo browser non supporta le notifiche desktop');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setIsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      return true;
    } else {
      setIsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      return false;
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    if (!isEnabled) {
      requestPermission();
    } else {
      setIsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    }
  }, [isEnabled, requestPermission]);

  // Logica per inviare le notifiche
  useEffect(() => {
    if (!isEnabled || permission !== 'granted' || lezioni.length === 0) return;

    const notifiedLessons = new Set<string>(
      JSON.parse(localStorage.getItem('notified_lessons') || '[]')
    );

    const checkUpcomingLessons = () => {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      lezioni.forEach(lezione => {
        if (!lezione.inizioDateObj) return;

        const startTime = new Date(lezione.inizioDateObj).getTime();
        const currentTime = now.getTime();
        
        // Se la lezione inizia tra 10 e 15 minuti e non è ancora stata notificata
        if (startTime > currentTime && startTime <= fifteenMinutesFromNow.getTime() && !notifiedLessons.has(lezione.id)) {
          const subjectName = cleanHtmlTags(lezione.nome_insegnamento);
          const room = cleanHtmlTags(lezione.aula);
          
          new Notification('Lezione in arrivo! 🎓', {
            body: `${subjectName} inizia tra 15 minuti in ${room}`,
            icon: '/logo192.png',
            tag: lezione.id // Impedisce notifiche duplicate per la stessa lezione
          });

          notifiedLessons.add(lezione.id);
          // Mantieni solo le ultime 50 notifiche per non intasare localStorage
          const updatedNotified = Array.from(notifiedLessons).slice(-50);
          localStorage.setItem('notified_lessons', JSON.stringify(updatedNotified));
        }
      });
    };

    // Controlla ogni minuto
    const intervalId = setInterval(checkUpcomingLessons, 60000);
    
    // Esegui un controllo immediato all'avvio
    checkUpcomingLessons();

    return () => clearInterval(intervalId);
  }, [isEnabled, permission, lezioni]);

  return { isEnabled, permission, requestPermission, toggleNotifications };
};
