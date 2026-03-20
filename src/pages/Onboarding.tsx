import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses, type Anno } from '@/hooks/useCourses';
import Select from '@/components/common/Select';
import PwaTutorial from '@/components/features/PwaTutorial';

export default function Onboarding() {
  const { corsi: listaCorsi, inCaricamento, errore: erroreCorsi } = useCourses();
  
  const [corso, setCorso] = useState('');
  const [anno, setAnno] = useState('');
  
  const [listaAnni, setListaAnni] = useState<Anno[]>([]);

  const [ricerca, setRicerca] = useState('');
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  const [showImportPopup, setShowImportPopup] = useState(false);
  const [toast, setToast] = useState<{ messaggio: string; tipo: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();

  const showToast = (messaggio: string, tipo: 'success' | 'error') => {
    setToast({ messaggio, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(event.target as Node)) {
        setTendinaAperta(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (corso) {
      const corsoIntero = listaCorsi.find(c => c.etichetta === corso);
      if (corsoIntero && corsoIntero.tutti_gli_anni) {
        const anniOrdinati = [...corsoIntero.tutti_gli_anni].sort((a, b) => 
          a.label.localeCompare(b.label)
        );
        setListaAnni(anniOrdinati);
      } else {
        setListaAnni([]);
      }
    } else {
      setListaAnni([]);
    }
    setAnno('');
  }, [corso, listaCorsi]);

  const corsiFiltrati = listaCorsi.filter(c => 
    c.etichetta.toLowerCase().includes(ricerca.toLowerCase())
  );

  const selezionaCorso = (nomeCorso: string) => {
    setCorso(nomeCorso);
    setRicerca(nomeCorso); 
    setTendinaAperta(false); 
  };

  const gestisciRicerca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRicerca(e.target.value);
    setTendinaAperta(true);
    if (corso) setCorso('');
  };

  const salvaImpostazioni = () => {
    if (!corso || !anno) {
      showToast("Seleziona sia il corso che l'anno/indirizzo!", "error");
      return;
    }
    
    const annoScelto = listaAnni.find(a => a.valore === anno);
    if (!annoScelto) return;
    
    localStorage.setItem('corsoCodice', annoScelto.codiceCorsoReale);
    localStorage.setItem('annoCodice', annoScelto.valore);
    localStorage.setItem('corsoNome', corso);
    localStorage.setItem('annoNome', annoScelto.label); 
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orario_')) {
            localStorage.removeItem(key);
        }
    }
    localStorage.removeItem('ultimoAggiornamento');
    
    navigate('/'); 
  };

  const handleImport = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        showToast("⚠️ Gli appunti sono vuoti!", "error");
        return;
      }

      const decodedString = decodeURIComponent(escape(window.atob(clipboardText)));
      const json = JSON.parse(decodedString);
      
      if (json.c) localStorage.setItem('corsoCodice', json.c);
      if (json.a) localStorage.setItem('annoCodice', json.a);
      if (json.n) localStorage.setItem('corsoNome', json.n);
      if (json.b) localStorage.setItem('blacklist_materie', JSON.stringify(json.b));
      
      if (json.m && Array.isArray(json.m)) {
        const materieRicostruite = json.m.map((item: any) => {
          if (typeof item === 'string') {
            const parts = item.split('|');
            return {
              id: Date.now().toString() + Math.random().toString(),
              corsoCodice: parts[0] || '',
              annoCodice: parts[1] || '',
              corsoNome: parts[2] || '',
              materiaNome: parts[3] || ''
            };
          }
          return {
            id: Date.now().toString() + Math.random().toString(),
            corsoCodice: item[0] || '',
            annoCodice: item[1] || '',
            corsoNome: item[2] || '',
            materiaNome: item[3] || ''
          };
        });

        const uniche = materieRicostruite.filter((v: any, i: number, a: any[]) => 
           a.findIndex((t: any) => t.corsoCodice === v.corsoCodice && t.annoCodice === v.annoCodice && t.materiaNome === v.materiaNome) === i
        );

        localStorage.setItem('materieExtra', JSON.stringify(uniche));
      }
      
      if (json.t) {
        Object.entries(json.t).forEach(([key, value]) => {
          localStorage.setItem(`nota_${key}`, value as string);
        });
      }

      showToast("🎉 Importazione completata! Avvio in corso...", "success");
      setTimeout(() => {
        navigate('/'); 
      }, 1500);

    } catch (e) {
      showToast("⚠️ Codice non valido o permesso negato.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 font-sans relative">
      
      {toast && !showImportPopup && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 w-[90%] max-w-sm text-center ${
          toast.tipo === 'success' 
            ? 'bg-green-950/90 border-green-500/50 text-green-400' 
            : 'bg-red-950/90 border-red-500/50 text-red-400'
        }`}>
          <span className="text-[13px] font-bold tracking-wide">{toast.messaggio}</span>
        </div>
      )}

      <div className="bg-[#212121] p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-[#333333]">
        
        <div className="mb-6">
          <div className="flex items-center gap-5 mb-5">
            <div className="bg-[#1a1a1a] border border-[#333] w-24 h-24 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
              <img src="/apple-touch-icon.png" alt="Logo UniSalento" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[1.75rem] font-black text-[#c48e12] leading-tight tracking-tight drop-shadow-[0_0_12px_rgba(196,142,18,0.7)]">
              NextLesson<br/>UniSalento
            </h1>
          </div>
          
          <div className="text-left mt-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Benvenuto!</h2>
            <p className="text-[#c48e12] mt-1 font-bold tracking-widest text-xs uppercase">
              Configura il tuo piano di studi
            </p>
          </div>
        </div>

        {inCaricamento ? (
          <div className="py-10 text-center text-[#c48e12] font-bold animate-pulse">
            Caricamento corsi in corso...
          </div>
        ) : erroreCorsi ? (
          <div className="py-10 text-center text-red-400 font-bold">
            ⚠️ {erroreCorsi}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 relative" ref={tendinaRef}>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Cerca il tuo Corso</label>
              <input 
                type="text"
                placeholder="Es. Ingegneria Informatica..."
                className="w-full bg-[#1a1a1a] border-2 border-transparent focus:border-[#c48e12] focus:bg-[#2a2a2a] rounded-2xl p-4 outline-none transition-all font-bold text-white placeholder-gray-600 shadow-inner text-sm"
                value={ricerca}
                onChange={gestisciRicerca}
                onClick={() => setTendinaAperta(true)}
              />
              {tendinaAperta && (
                <ul className="absolute z-50 w-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                  {corsiFiltrati.length > 0 ? (
                    corsiFiltrati.map((c, i) => (
                      <li 
                        key={i} 
                        onClick={() => selezionaCorso(c.etichetta)}
                        className="p-4 hover:bg-[#383838] cursor-pointer border-b border-[#333] last:border-none text-sm font-medium text-gray-300 transition-colors"
                      >
                        {c.etichetta}
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-gray-500 text-center font-medium">Nessun corso trovato</li>
                  )}
                </ul>
              )}
            </div>

            <Select 
              label="Anno e Indirizzo"
              placeholder={!corso ? "Prima seleziona un corso 👆" : "Scegli l'anno/indirizzo"}
              value={anno}
              onChange={(val) => setAnno(val)}
              disabled={!corso}
              options={listaAnni.map(a => ({ valore: a.valore, label: a.label }))}
            />
            
            <div className="pt-2 space-y-4">
              <button 
                onClick={salvaImpostazioni}
                className="w-full font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 bg-[#c48e12] text-[#121212] hover:bg-[#d89e17] shadow-[#c48e12]/20"
              >
                Configurazione Completata
              </button>
              
              <div className="text-center">
                <button 
                  onClick={() => setShowImportPopup(true)}
                  className="text-[11px] font-bold text-gray-500 hover:text-[#c48e12] transition-colors underline decoration-gray-700 hover:decoration-[#c48e12] underline-offset-4"
                >
                  Hai già una configurazione? Importala qui
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 text-center border-t border-[#333] mt-6">
          <p className="text-[10px] font-bold text-gray-600 tracking-widest uppercase">
            made by {' '}
            <a 
              href="https://github.com/DiNataleAlessandro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#c48e12]/80 no-underline hover:no-underline"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <span className="text-[#c48e12]/80">Λlεx</span>
            </a>
          </p>
        </div>
      </div>

      {showImportPopup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 items-center justify-center gap-4" onClick={() => setShowImportPopup(false)}>
          <div className="bg-[#212121] border border-[#333] p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1a1a1a] border border-[#333] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="73.33" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-[#c48e12]">
                <g>
                  <path d="M400,250l-150,-150" />
                  <path d="M250,100l-150,150" />
                </g>
                <path d="M250,100l-0,450" />
                <g>
                  <path d="M672.081,400l-150,150" />
                  <path d="M522.081,550l-150,-150" />
                </g>
                <path d="M522.081,550l0,-450" />
                <path d="M100,550l0,75c0,41.144 33.856,75 75,75l450,0c41.144,0 75,-33.856 75,-75l0,-75" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-white mb-2 tracking-tight">Importa Dati</h2>

            <p className="text-xs text-gray-400 mb-8 font-medium leading-relaxed">
              Recupera il tuo piano di studi, appunti ed esami a scelta istantaneamente.
            </p>

            <div className="space-y-4">
              <button 
                onClick={handleImport} 
                className="w-full py-4 rounded-xl font-black text-[#121212] bg-[#c48e12] hover:bg-[#d89e17] transition-colors active:scale-95 shadow-lg shadow-[#c48e12]/20 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Incolla e Ripristina
              </button>

              <button 
                onClick={() => setShowImportPopup(false)} 
                className="w-full py-3.5 rounded-xl font-bold text-gray-400 bg-transparent hover:text-white transition-colors active:scale-95"
              >
                Annulla
              </button>
            </div>
          </div>

          {toast && (
            <div 
              className={`w-full max-w-sm px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 text-center ${
                toast.tipo === 'success' 
                  ? 'bg-green-950/90 border-green-500/50 text-green-400' 
                  : 'bg-red-950/90 border-red-500/50 text-red-400'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <span className="text-[13px] font-bold tracking-wide">{toast.messaggio}</span>
            </div>
          )}
        </div>
      )}
      <PwaTutorial />
      </div>
      );
      }