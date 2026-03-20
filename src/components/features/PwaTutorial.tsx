import { useState, useEffect } from 'react';

export default function PwaTutorial() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Controllo se l'app è già in modalità standalone (PWA installata)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Mostriamo il tutorial solo se è mobile e NON è già standalone
    if (isMobile && !isStandalone) {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
      }
      
      // Ritardiamo leggermente l'apparizione per non disturbare il caricamento iniziale
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-end p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-500">
      <div 
        className="w-full max-w-sm bg-[#212121] border border-[#333] rounded-[2.5rem] p-7 shadow-2xl mb-4 animate-in slide-in-from-bottom-10 duration-500 ease-out"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
           <div className="bg-[#c48e12]/10 p-3.5 rounded-2xl border border-[#c48e12]/20 shadow-inner">
             <svg className="w-8 h-8 text-[#c48e12] drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
             </svg>
           </div>
           <button onClick={() => setShow(false)} className="bg-[#2a2a2a] p-2 rounded-full text-gray-500 hover:text-white transition-colors border border-[#444]">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <h3 className="text-2xl font-black text-white mb-2 leading-tight tracking-tight">Installa l'App</h3>
        <p className="text-[13px] text-gray-400 font-medium mb-8 leading-relaxed">
          Aggiungi <span className="text-[#c48e12] font-bold">NextLesson</span> alla tua schermata home per un'esperienza a schermo intero e accesso rapido.
        </p>

        <div className="bg-[#1a1a1a] rounded-[1.5rem] p-5 border border-[#333] space-y-6 shadow-inner">
          {platform === 'ios' ? (
            <>
              <div className="flex items-center gap-4">
                <div className="bg-[#2a2a2a] w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#444] shadow-md">
                  <svg 
                    viewBox="0 0 800 800" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="73.33" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-5 h-5 text-blue-500 -rotate-90"
                  >
                    <g>
                      <path d="M550,550l150,-150" />
                      <path d="M700,400l-150,-150" />
                    </g>
                    <path d="M700,400l-450,-0" />
                    <path d="M250,100l-75,0c-41.144,0 -75,33.856 -75,75l0,450c0,41.144 33.856,75 75,75l75,0" />
                  </svg>
                </div>
                <p className="text-xs text-gray-300 font-bold leading-snug">Tocca il tasto <span className="text-blue-500">Condividi</span> nella barra del browser.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#2a2a2a] w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#444] shadow-md">
                  <svg 
                    viewBox="0 0 800 800" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="60" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="w-6 h-6 text-white"
                  >
                    <g transform="matrix(0,-1,1,0,0,800)">
                        <path d="M250,100L175,100C133.856,100 100,133.856 100,175L100,625C100,666.144 133.856,700 175,700L250,700" />
                    </g>
                    <g transform="matrix(0.000342,1,-1,0.000342,799.91438,-0.13424)">
                        <path d="M250,100L175,100C133.856,100 100,133.856 100,175L100,625C100,666.144 133.856,700 175,700L250,700" />
                    </g>
                    <path d="M100,250.105L100,550" />
                    <path d="M700,550L700,250.105" />
                    <path d="M400,250.105L400,550" />
                    <g transform="matrix(0,-1,1,0,-0.052733,800)">
                        <path d="M400,250.105L400,550" />
                    </g>
                  </svg>
                </div>
                <p className="text-xs text-gray-300 font-bold leading-snug">Scorri e seleziona <span className="text-white">"Aggiungi alla schermata Home"</span>.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="bg-[#2a2a2a] w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#444] shadow-md">
                   <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </div>
                <p className="text-xs text-gray-300 font-bold leading-snug">Tocca i <span className="text-white">tre puntini</span> in alto a destra nel browser.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#2a2a2a] w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#444] shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <p className="text-xs text-gray-300 font-bold leading-snug">Tocca <span className="text-white">"Installa applicazione"</span> o "Aggiungi a home".</p>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={() => setShow(false)}
          className="w-full mt-8 py-4.5 rounded-[1.25rem] font-black text-[#121212] bg-[#c48e12] active:scale-95 transition-all shadow-lg shadow-[#c48e12]/30 text-sm uppercase tracking-widest"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}