import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { elenco_corsi } from '../constants/courses'; 

export default function Onboarding() {
  const [corso, setCorso] = useState('');
  const [anno, setAnno] = useState('');
  
  const [listaCorsi, setListaCorsi] = useState<{
    etichetta: string, 
    tutti_gli_anni: { label: string, valore: string, codiceCorsoReale: string }[]
  }[]>([]);
  
  const [listaAnni, setListaAnni] = useState<{
    label: string, valore: string, codiceCorsoReale: string
  }[]>([]);

  const [ricerca, setRicerca] = useState('');
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  // Stati per il popup di Importazione e i Toast
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [importString, setImportString] = useState('');
  const [toast, setToast] = useState<{ messaggio: string; tipo: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();

  const showToast = (messaggio: string, tipo: 'success' | 'error') => {
    setToast({ messaggio, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Group raw course data into a unified map to handle multiple years/paths per course
  useEffect(() => {
    const corsiUnificati = new Map<string, { etichetta: string, tutti_gli_anni: any[] }>();

    elenco_corsi.forEach((item: any) => {
      const chiave = `${item.label} (${item.tipo})`;
      
      if (!corsiUnificati.has(chiave)) {
        corsiUnificati.set(chiave, {
          etichetta: chiave,
          tutti_gli_anni: []
        });
      } 
      
      const corsoEsistente = corsiUnificati.get(chiave)!;
      
      (item.elenco_anni || []).forEach((annoNuovo: any) => {
        const annoEsistente = corsoEsistente.tutti_gli_anni.find(a => a.label === annoNuovo.label);
        
        if (!annoEsistente) {
          corsoEsistente.tutti_gli_anni.push({
            label: annoNuovo.label,
            valore: annoNuovo.valore,
            codiceCorsoReale: item.valore 
          });
        }
      });
    });

    const mappati = Array.from(corsiUnificati.values());
    mappati.sort((a: any, b: any) => a.etichetta.localeCompare(b.etichetta));
    
    setListaCorsi(mappati);
  }, []);

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
        const anniOrdinati = [...corsoIntero.tutti_gli_anni].sort((a: any, b: any) => 
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
    
    // Wipe existing schedule cache when changing course to prevent data pollution
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orario_')) {
            localStorage.removeItem(key);
        }
    }
    localStorage.removeItem('ultimoAggiornamento');
    
    navigate('/'); 
  };

  // Funzione per gestire l'importazione direttamente dall'Onboarding
  const handleImport = () => {
    if (!importString.trim()) return;

    try {
      const decodedString = decodeURIComponent(escape(window.atob(importString)));
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
      showToast("⚠️ Codice non valido. Controlla e riprova.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 font-sans relative">
      
      {/* TOAST GLOBALE (quando il popup è chiuso) */}
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

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Anno e Indirizzo</label>
            <select 
              className={`w-full bg-[#1a1a1a] border-2 border-transparent focus:border-[#c48e12] focus:bg-[#2a2a2a] rounded-2xl p-4 outline-none transition-all font-bold text-sm shadow-inner appearance-none
                ${!corso ? 'text-gray-600 cursor-not-allowed' : 'text-white'}`}
              value={anno}
              onChange={(e) => setAnno(e.target.value)}
              disabled={!corso}
            >
              <option value="" className="text-gray-500">
                {!corso ? "Prima seleziona un corso 👆" : "Scegli l'anno/indirizzo"}
              </option>
              {listaAnni.map((a, i) => (
                <option key={i} value={a.valore} className="text-gray-200 bg-[#2a2a2a]">{a.label}</option>
              ))}
            </select>
          </div>
          
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

          <div className="pt-2 text-center">
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
      </div>

      {/* POPUP IMPORTAZIONE ONBOARDING */}
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
            
            <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
              Incolla il tuo codice di backup per ripristinare il piano di studi, appunti ed esami a scelta.
            </p>

            <div className="space-y-4">
              <textarea 
                value={importString}
                onChange={(e) => setImportString(e.target.value)}
                placeholder="Incolla qui la stringa di backup..."
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl p-3 text-xs text-gray-300 focus:outline-none focus:border-[#c48e12] h-20 resize-none font-mono"
              />

              <div className="flex gap-3">
                <button onClick={() => setShowImportPopup(false)} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#333] hover:bg-[#444] transition-colors active:scale-95">
                  Annulla
                </button>
                <button onClick={handleImport} className="flex-1 py-3.5 rounded-xl font-black text-[#121212] bg-[#c48e12] hover:bg-[#d89e17] transition-colors active:scale-95 shadow-lg shadow-[#c48e12]/20">
                  Importa
                </button>
              </div>
            </div>
          </div>

          {/* TOAST LOCALE (mostrato esattamente sotto il popup) */}
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

    </div>
  );
}