import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardLezione from '@/components/features/CardLezione';
import { useLessons } from '@/hooks/useLessons';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDateForAPI } from '@/utils/date';
import type { Lezione } from '@/types/lezione';
import { cleanHtmlTags } from '@/api/transformers';
import BottomNavbar from '@/components/common/BottomNavbar';

export default function Home() {
  const navigate = useNavigate();
  const corsoCodice = localStorage.getItem('corsoCodice') || '';
  const annoCodice = localStorage.getItem('annoCodice') || '';
  const corsoNome = localStorage.getItem('corsoNome') || '';

  const [refreshCount, setRefreshCount] = useState(0);
  const { lezioni, inCaricamento, errore, ultimoAggiornamento, fineSettimanaCorrente } = useLessons({
    corsoCodice,
    annoCodice,
    refreshCount
  });

  const { isEnabled: notificationsEnabled, toggleNotifications, permission: notificationPermission, isSupported: notificationsSupported } = useNotifications();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>(JSON.parse(localStorage.getItem('blacklist_materie') || '[]'));
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [oraAttuale, setOraAttuale] = useState(new Date());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timerId = setInterval(() => setOraAttuale(new Date()), 60000); 
    return () => clearInterval(timerId);
  }, []);

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear(); 
    navigate('/onboarding');
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => setOraAttuale(new Date()), 60000); 
    return () => clearInterval(timerId);
  }, []);

  const uniqueSubjects = Array.from(new Set(lezioni.map(l => cleanHtmlTags(l.nome_insegnamento)))).sort();

  const toggleBlacklistSubject = (materia: string) => {
    let newBlacklist = [...blacklist];
    if (newBlacklist.includes(materia)) {
      newBlacklist = newBlacklist.filter(m => m !== materia);
    } else {
      newBlacklist.push(materia);
    }
    setBlacklist(newBlacklist);
    localStorage.setItem('blacklist_materie', JSON.stringify(newBlacklist));
  };

  const filteredLessons = lezioni.filter(l => !blacklist.includes(cleanHtmlTags(l.nome_insegnamento)));

  const liveLessons = filteredLessons.filter(lezione => {
    if (!lezione.inizioDateObj || !lezione.fineDateObj || lezione.isAnnullata) return false;
    return lezione.inizioDateObj <= oraAttuale && lezione.fineDateObj > oraAttuale;
  });

  const liveLessonIds = new Set(liveLessons.map(l => l.id));

  const futureLessons = filteredLessons.filter((lezione) => {
      if (liveLessonIds.has(lezione.id)) return false;
      if (!lezione.fineDateObj) return true;
      return lezione.fineDateObj > oraAttuale;
  });

  const thisWeekLessons = futureLessons.filter(l => !fineSettimanaCorrente || l.inizioDateObj! <= fineSettimanaCorrente);
  const nextWeekLessons = futureLessons.filter(l => fineSettimanaCorrente && l.inizioDateObj! > fineSettimanaCorrente);

  const groupByDay = (lessonList: Lezione[]) => {
    const groups = new Map<string, Lezione[]>();
    lessonList.forEach(l => {
      const key = `${l.nome_giorno} ${l.data}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(l);
    });
    return Array.from(groups.entries());
  };

  const oggiStr = formatDateForAPI(oraAttuale);
  const dataDomani = new Date(oraAttuale);
  dataDomani.setDate(dataDomani.getDate() + 1);
  const domaniStr = formatDateForAPI(dataDomani);

  const getEtichettaGiorno = (dataLezioneStr: string, giornoOriginale: string) => {
    if (dataLezioneStr === oggiStr) {
      return liveLessons.length > 0 ? "IN ARRIVO" : "OGGI";
    }
    if (dataLezioneStr === domaniStr) {
      return "DOMANI";
    }
    return giornoOriginale || "DATA IGNOTA";
  };

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      <header className="flex justify-between items-center mb-4 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Lezioni</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">
            {corsoNome}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl hover:bg-[#2a2a2a] transition-colors text-gray-300 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ... (rest of Home content) */}

      <div className="mb-4 flex items-center justify-between bg-[#1a1a1a] border border-[#333] p-3 rounded-xl shadow-inner">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {!isOffline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOffline ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white tracking-widest uppercase">
              {isOffline ? 'Modalità Offline' : 'Connesso'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium mt-0.5">
              {ultimoAggiornamento ? `Dati del ${ultimoAggiornamento}` : 'Nessun dato salvato'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (isOffline) alert("Sei offline! Connettiti per sincronizzare l'orario.");
            else setRefreshCount(c => c + 1);
          }}
          disabled={inCaricamento || isOffline}
          className={`p-2 rounded-lg transition-all ${inCaricamento || isOffline ? 'opacity-30 cursor-not-allowed' : 'bg-[#2a2a2a] hover:bg-[#333] active:scale-95 border border-[#444] text-[#c48e12] shadow-lg'}`}
          title="Forza Sincronizzazione"
        >
          <svg className={`w-5 h-5 ${inCaricamento ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 h-7">
        <div className="flex items-center gap-3 h-full">
          <label className="relative inline-flex items-center cursor-pointer h-full -translate-y-[0.5px]">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={notificationsEnabled}
              onChange={toggleNotifications}
              disabled={notificationPermission === 'denied' || !notificationsSupported}
            />
            <div className={`w-11 h-7 rounded-full transition-all duration-300 peer flex items-center px-1
              ${(notificationPermission === 'denied' || !notificationsSupported) ? 'bg-red-900/20 border border-red-900/30' : 'bg-[#1a1a1a] border border-[#333]'} 
              peer-checked:bg-[#c48e12]/10 peer-checked:border-[#c48e12]/40`}>
              <div className={`h-5 w-5 rounded-full transition-all duration-500 transform flex items-center justify-center
                ${notificationsEnabled 
                  ? 'translate-x-4 bg-[#1a1a1a] border border-[#c48e12] shadow-[0_0_15px_rgba(196,142,18,0.4)]' 
                  : 'translate-x-0 bg-[#2a2a2a] border border-[#444]'}
              `}>
                {notificationPermission === 'denied' || !notificationsSupported ? (
                  <svg viewBox="0 0 48 48" className="w-3.5 h-3.5 text-red-500/70" fill="currentColor">
                    <path d="M43.4,29.4l-3.2-3.2A4.5,4.5,0,0,1,39,23.3V17C39,8.9,33.6,2,24,2S9,8.7,9,17v7a2.6,2.6,0,0,1-.7,1.7L4.6,29.4A2,2,0,0,0,4,30.8V38a2,2,0,0,0,2,2H17.1a7,7,0,0,0,13.8,0H42a2,2,0,0,0,2-2V30.8A2,2,0,0,0,43.4,29.4ZM40,36H8V31.7l3.1-3.2A6.4,6.4,0,0,0,13,24V17c0-5.3,2.9-11,11-11s11,5.9,11,11v6.3A8.6,8.6,0,0,0,37.3,29L40,31.7Z"/>
                    <rect x="16" y="20" width="16" height="4" rx="2" ry="2"/>
                  </svg>
                ) : notificationsEnabled ? (
                  <svg viewBox="0 0 48 48" className="w-3.5 h-3.5 text-[#c48e12] drop-shadow-[0_0_3px_rgba(196,142,18,0.8)]" fill="currentColor">
                    <path d="M40.2,26.2A4.5,4.5,0,0,1,39,23.3V19c0-8.1-5.4-15-15-15S9,10.7,9,19v5a2.6,2.6,0,0,1-.7,1.7L4.6,29.4A2,2,0,0,0,4,30.8V38a2,2,0,0,0,2,2H17.1a7,7,0,0,0,13.8,0H42a2,2,0,0,0,2-2V30.8a2,2,0,0,0-.6-1.4ZM40,36H8V31.7l3.1-3.2A6.4,6.4,0,0,0,13,24V19c0-5.3,2.9-11,11-11s11,5.9,11,11v4.3A8.6,8.6,0,0,0,37.3,29L40,31.7Z"/>
                    <path d="M7,19A17.1,17.1,0,0,1,13.5,5.6a2,2,0,0,0,.4-2.8,2,2,0,0,0-2.8-.3A20.6,20.6,0,0,0,3,19a2,2,0,0,0,4,0Z"/>
                    <path d="M36.9,2.4a2,2,0,0,0-2.8.4,2,2,0,0,0,.4,2.8A16.9,16.9,0,0,1,41,19a2,2,0,0,0,4,0A20.9,20.9,0,0,0,36.9,2.4Z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 48 48" className="w-3.5 h-3.5 text-gray-500" fill="currentColor">
                    <path d="M43.4,29.4l-3.2-3.2A4.7,4.7,0,0,1,39,23.3V17C39,8.9,33.6,2,24,2A14.7,14.7,0,0,0,13.1,6.2L15.9,9c1.7-1.8,4.3-3,8.1-3,8.1,0,11,5.9,11,11v6.3A8.6,8.6,0,0,0,37.3,29L40,31.7v1.5l4,4V30.8A2,2,0,0,0,43.4,29.4Z"/>
                    <path d="M5.2,4.4a1.9,1.9,0,0,0-2.8,0,1.9,1.9,0,0,0,0,2.8l6.8,6.9A26.4,26.4,0,0,0,9,17v7a2.3,2.3,0,0,1-.7,1.7L4.6,29.4A2,2,0,0,0,4,30.8V38a2,2,0,0,0,2,2H17.1a7,7,0,0,0,13.8,0h4.3l3.6,3.6a2,2,0,1,0,2.8-2.8ZM8,36V31.7l3.1-3.2A6.4,6.4,0,0,0,13,24V17.8L31.2,36Z"/>
                  </svg>
                )}
              </div>
            </div>
          </label>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${notificationsEnabled ? 'text-[#c48e12]' : (notificationPermission === 'denied' || !notificationsSupported ? 'text-red-500 opacity-60' : 'text-gray-500')}`}>
            {!notificationsSupported ? 'Non Supportate' : (notificationPermission === 'denied' ? 'Notifiche Bloccate' : 'Notifiche')}
          </span>
        </div>

        <button 
          onClick={() => setShowBlacklist(true)} 
          className={`flex items-center gap-2 px-4 h-7 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
            blacklist.length > 0 
              ? 'bg-[#c48e12]/10 border-[#c48e12]/40 text-[#c48e12]' 
              : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#212121] hover:text-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {blacklist.length > 0 ? `${blacklist.length} Filtri` : 'Nascondi Materie'}
        </button>
      </div>

      <div className="space-y-4">
        {inCaricamento && refreshCount === 0 && (
          <div className="text-center p-10 text-[#c48e12] font-bold text-sm uppercase tracking-widest animate-pulse">
            ⏳ Caricamento iniziale...
          </div>
        )}

        {errore && (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-900/50 text-center font-medium text-sm">
            ⚠️ {errore}
          </div>
        )}

        {!inCaricamento && !errore && liveLessons.length === 0 && futureLessons.length === 0 && (
          <div className="text-center p-10 text-gray-500 font-medium bg-[#212121] rounded-2xl shadow-lg border border-[#333] flex flex-col items-center justify-center gap-3">
            <span className="text-4xl opacity-50">🥂</span>
            <p className="text-sm">Nessuna lezione in programma a breve termine.</p>
          </div>
        )}

        {!inCaricamento && liveLessons.length > 0 && (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-[#c48e12] uppercase tracking-[0.2em] mb-3 pl-2 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c48e12] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c48e12]"></span>
                    </span>
                    In Corso Ora
                </h3>
                <div className="grid gap-4">
                  {liveLessons.map(lesson => (
                    <CardLezione key={lesson.id} lezione={lesson} isLive={true} />
                  ))}
                </div>
            </div>
        )}

        {!inCaricamento && thisWeekLessons.length > 0 && (
          <div className="mt-8">
            {groupByDay(thisWeekLessons).map(([giorno, lezioniGiorno], index) => {
              const dataCorrente = lezioniGiorno.length > 0 ? lezioniGiorno[0].data : '';
              const etichetta = getEtichettaGiorno(dataCorrente, giorno);

              return (
                <div key={index} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-black text-[#c48e12] uppercase tracking-widest">
                      {etichetta}
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-[#c48e12]/40 to-transparent"></div>
                  </div>
                  
                  <div className="grid gap-4">
                    {lezioniGiorno.map((lezione) => (
                      <CardLezione key={lezione.id} lezione={lezione} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!inCaricamento && nextWeekLessons.length > 0 && (
          <div className="mt-12 mb-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg">
                    Prossima Settimana
                </span>
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
            </div>
            
            {groupByDay(nextWeekLessons).map(([giorno, lezioniGiorno], index) => {
              const dataCorrente = lezioniGiorno.length > 0 ? lezioniGiorno[0].data : '';
              const etichetta = getEtichettaGiorno(dataCorrente, giorno);

              return (
                <div key={index} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-black text-[#c48e12] uppercase tracking-widest">
                      {etichetta}
                    </span>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-[#c48e12]/40 to-transparent"></div>
                  </div>
                  
                  <div className="grid gap-4">
                    {lezioniGiorno.map((lezione) => (
                      <CardLezione key={lezione.id} lezione={lezione} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBlacklist && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 transition-opacity">
          <div className="bg-[#212121] border border-[#333] rounded-[2rem] shadow-2xl w-full max-w-md mx-auto flex flex-col h-[85vh] overflow-hidden mt-8">
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
              <div>
                <h2 className="text-xl font-black text-white">Nascondi Materie</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium">Tocca una materia per nasconderla dall'agenda.</p>
              </div>
              <button onClick={() => setShowBlacklist(false)} className="bg-[#2a2a2a] p-2 rounded-full text-gray-400 hover:text-white active:scale-95 border border-[#444]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {uniqueSubjects.length === 0 ? (
                <p className="text-center text-gray-500 mt-10 text-sm">Nessuna materia caricata.</p>
              ) : (
                uniqueSubjects.map((materia, idx) => {
                  const isHidden = blacklist.includes(materia);
                  return (
                    <button 
                      key={idx}
                      onClick={() => toggleBlacklistSubject(materia)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                        isHidden 
                          ? 'bg-[#1a1a1a] border-[#333] opacity-60' 
                          : 'bg-gradient-to-r from-[#2a2215] to-[#212121] border-[#c48e12]/30 shadow-md'
                      }`}
                    >
                      <span className={`font-bold pr-4 ${isHidden ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {materia}
                      </span>
                      {isHidden ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-[#c48e12] shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333]">
              <button 
                onClick={() => setShowBlacklist(false)}
                className="w-full font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 bg-[#c48e12] text-[#121212] shadow-[#c48e12]/20"
              >
                Applica Filtri
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 transition-opacity items-center justify-center" onClick={() => setShowSettings(false)}>
          <div className="bg-[#212121] border border-[#333] p-8 rounded-[2rem] shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Impostazioni</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Aspetto e Tema</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { 
                      id: 'dark', 
                      label: 'Scuro', 
                      icon: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      )
                    },
                    { 
                      id: 'light', 
                      label: 'Chiaro', 
                      icon: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                      )
                    },
                    { 
                      id: 'system', 
                      label: 'Dispositivo', 
                      icon: (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="2" width="12" height="20" rx="2" ry="2" />
                          <path d="M12 18h.01" />
                          <path d="M10 5h4" />
                        </svg>
                      )
                    }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        theme === t.id 
                          ? 'bg-[#c48e12]/10 border-[#c48e12] text-[#c48e12]' 
                          : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <span className="flex items-center justify-center">{t.icon}</span>
                      <span className="text-[10px] font-bold uppercase">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#333]">
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    // Usiamo un piccolo ritardo per evitare sovrapposizioni di popup
                    setTimeout(() => setShowResetConfirm(true), 100);
                  }}
                  className="w-full py-4 rounded-xl font-black text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <svg viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <g><path d="M550,550l150,-150" /><path d="M700,400l-150,-150" /></g>
                    <path d="M700,400l-450,-0" />
                    <path d="M250,100l-75,0c-41.144,0 -75,33.856 -75,75l0,450c0,41.144 33.856,75 75,75l75,0" />
                  </svg>
                  Esci e Cambia Corso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex flex-col p-4 transition-opacity items-center justify-center" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-[#212121] border border-[#333] p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="bg-red-500/10 border border-red-500/20 w-20 h-20 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-red-500">
                <g><path d="M550,550l150,-150" /><path d="M700,400l-150,-150" /></g>
                <path d="M700,400l-450,-0" />
                <path d="M250,100l-75,0c-41.144,0 -75,33.856 -75,75l0,450c0,41.144 33.856,75 75,75l75,0" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Cambiare Corso?</h2>
            <p className="text-[13px] text-gray-400 mb-8 font-medium leading-relaxed">
              Verrai riportato all'onboarding. Tutte le tue <span className="text-white font-bold">note, materie extra e filtri</span> andranno persi se non hai salvato il codice di backup.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleReset}
                className="w-full py-4.5 rounded-[1.25rem] font-black text-[#121212] bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-sm"
              >
                Sì, Resetta Tutto
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-4 rounded-[1.25rem] font-bold text-gray-400 bg-transparent hover:text-white transition-colors active:scale-95 text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavbar activeTab="lezioni" />
    </div>
  );
}
