import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => setIsVisible(false), 500); // Durata dissolvenza
    }, 1500); // Tempo di esposizione logo

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-[var(--bg-app)] flex flex-col items-center justify-center transition-opacity duration-500 h-[100dvh] w-screen ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex items-center justify-center">
        {/* Bagliore soffuso (Radial Gradient per evitare artefatti "squadrati") */}
        <div 
          className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #c48e12 0%, transparent 70%)'
          }}
        ></div>
        
        <div className="relative animate-in zoom-in duration-700 ease-out">
          <img 
            src="/apple-touch-icon.png" 
            alt="Logo" 
            className="w-32 h-32 rounded-[2rem] shadow-2xl drop-shadow-[0_0_15px_rgba(196,142,18,0.3)]"
          />
        </div>
      </div>
      
      <div className="mt-10 flex flex-col items-center gap-3">
        <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
          NextLesson <span className="text-[#c48e12]">UniSalento</span>
        </h1>
        <div className="w-12 h-1 bg-gradient-to-r from-transparent via-[#c48e12] to-transparent rounded-full animate-pulse"></div>
      </div>

      <div className="absolute bottom-12 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">
        Caricamento in corso
      </div>
    </div>
  );
}
