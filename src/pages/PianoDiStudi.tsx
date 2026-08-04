import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourses } from '@/hooks/useCourses';
import { formatDateForAPI, getAcademicYear } from '@/utils/date';
import { cleanHtmlTags, isValidLesson } from '@/api/transformers';
import Select from '@/components/common/Select';
import BottomNavbar from '@/components/common/BottomNavbar';

export default function PianoDiStudi() {
  const navigate = useNavigate();
  const { corsi: listaCorsiGlobali, inCaricamento: inCaricamentoCorsi, errore: erroreCorsi } = useCourses();
  
  const [materieSalvate, setMaterieSalvate] = useState<{ id: string, corsoCodice: string, annoCodice: string, corsoNome: string, materiaNome: string }[]>(JSON.parse(localStorage.getItem('materieExtra') || '[]'));
  
  const [ricerca, setRicerca] = useState('');
  const [corsoSelezionato, setCorsoSelezionato] = useState<any>(null);
  const [annoSelezionato, setAnnoSelezionato] = useState('');
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  const [inCaricamento, setInCaricamento] = useState(false);
  const [materieTrovate, setMaterieTrovate] = useState<string[]>([]);
  const [materieSpuntate, setMaterieSpuntate] = useState<string[]>([]);

  const [showBackupPopup, setShowBackupPopup] = useState(false);
  
  const [toast, setToast] = useState<{ messaggio: string; tipo: 'success' | 'error' } | null>(null);

  const mioAnnoCodice = localStorage.getItem('annoCodice') || ''; 

  const showToast = (messaggio: string, tipo: 'success' | 'error') => {
    setToast({ messaggio, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(e.target as Node)) setTendinaAperta(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const cercaMaterieNelCorso = async () => {
    if (!corsoSelezionato || !annoSelezionato) return;
    const annoObj = corsoSelezionato.tutti_gli_anni.find((a: any) => a.valore === annoSelezionato);
    if (!annoObj) return;

    setInCaricamento(true);
    setMaterieTrovate([]);
    setMaterieSpuntate([]);

    setTimeout(() => {
      const uniqueSubjects = (annoObj.insegnamenti || []).sort();
      
      if (uniqueSubjects.length === 0) {
        showToast("Nessuna materia trovata (elenco non pubblicato).", "error");
      }
      
      setMaterieTrovate(uniqueSubjects);
      setInCaricamento(false);
    }, 300); // Piccolo ritardo per feedback visivo
  };

  const toggleSpunta = (materia: string) => {
    if (materieSpuntate.includes(materia)) {
      setMaterieSpuntate(materieSpuntate.filter(m => m !== materia));
    } else {
      setMaterieSpuntate([...materieSpuntate, materia]);
    }
  };

  const salvaEsamiExtra = () => {
    const annoObj = corsoSelezionato.tutti_gli_anni.find((a: any) => a.valore === annoSelezionato);
    
    const nuoviSalvataggi = materieSpuntate
      .filter(materia => !materieSalvate.some(ms => 
         ms.corsoCodice === annoObj.codiceCorsoReale && 
         ms.annoCodice === annoObj.valore && 
         ms.materiaNome === materia
      ))
      .map(materia => ({
        id: Date.now().toString() + Math.random().toString(),
        corsoCodice: annoObj.codiceCorsoReale,
        annoCodice: annoObj.valore,
        corsoNome: corsoSelezionato.etichetta,
        materiaNome: materia
      }));

    const nuovoStato = [...materieSalvate, ...nuoviSalvataggi];
    setMaterieSalvate(nuovoStato);
    localStorage.setItem('materieExtra', JSON.stringify(nuovoStato));
    
    setCorsoSelezionato(null);
    setAnnoSelezionato('');
    setRicerca('');
    setMaterieTrovate([]);
    setMaterieSpuntate([]);
  };

  const eliminaMateriaSalvata = (id: string) => {
    const filtrate = materieSalvate.filter(m => m.id !== id);
    setMaterieSalvate(filtrate);
    localStorage.setItem('materieExtra', JSON.stringify(filtrate));
  };

  const handleExport = async () => {
    try {
      const materieExtra = JSON.parse(localStorage.getItem('materieExtra') || '[]');
      
      const materieCompresse = materieExtra.map((m: any) => [
        m.corsoCodice, m.annoCodice, m.corsoNome, m.materiaNome
      ]);

      const noteCompresse = Object.keys(localStorage)
        .filter(key => key.startsWith('nota_'))
        .reduce((obj, key) => {
          obj[key.replace('nota_', '')] = localStorage.getItem(key);
          return obj;
        }, {} as any);

      const miniBackup = {
        c: localStorage.getItem('corsoCodice'),
        a: localStorage.getItem('annoCodice'),
        n: localStorage.getItem('corsoNome'),
        m: materieCompresse,
        b: JSON.parse(localStorage.getItem('blacklist_materie') || '[]'),
        t: noteCompresse 
      };

      const jsonString = JSON.stringify(miniBackup);
      const base64String = window.btoa(unescape(encodeURIComponent(jsonString)));
      
      await navigator.clipboard.writeText(base64String);
      showToast("✅ Codice copiato negli appunti!", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Errore durante la copia. Riprova.", "error");
    }
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

      showToast("🎉 Importazione completata! Riavvio in corso...", "success");
      
      setTimeout(() => {
        window.location.href = '/'; 
      }, 1500);

    } catch (e) {
      showToast("⚠️ Codice non valido o permesso negato.", "error");
    }
  };

  const corsiFiltratiSearch = listaCorsiGlobali.filter(c => 
    c.etichetta.toLowerCase().includes(ricerca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      
      {toast && !showBackupPopup && (
        <div className={`fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[9999] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 w-[90%] max-w-sm text-center ${
          toast.tipo === 'success' 
            ? 'bg-green-950/90 border-green-500/50 text-green-400' 
            : 'bg-red-950/90 border-red-500/50 text-red-400'
        }`}>
          <span className="text-[13px] font-bold tracking-wide">{toast.messaggio}</span>
        </div>
      )}

      <header className="flex justify-between items-center mb-6 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Piano di Studi</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">Personalizza le tue lezioni</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBackupPopup(true)}
            className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl transition-colors shadow-inner flex items-center justify-center hover:bg-[#2a2a2a] text-gray-300 active:scale-95"
            title="Backup e Portabilità"
          >
            <svg viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="73.33" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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
          </button>
        </div>
      </header>

      <div className="mb-8">
        <h3 className="text-[10px] font-black text-[#c48e12] uppercase tracking-[0.2em] mb-3 ml-2">Aggiungi nuovo esame a scelta</h3>
        
        {inCaricamentoCorsi ? (
          <div className="py-10 text-center text-[#c48e12] font-bold animate-pulse">Caricamento corsi...</div>
        ) : erroreCorsi ? (
          <div className="py-10 text-center text-red-400 font-bold">⚠️ {erroreCorsi}</div>
        ) : !corsoSelezionato ? (
          <div className="space-y-2 relative" ref={tendinaRef}>
            <input 
              type="text"
              placeholder="Cerca la facoltà dell'esame..."
              className="w-full bg-[#1a1a1a] border border-[#444] focus:border-[#c48e12] rounded-xl p-4 outline-none transition-all font-bold text-white placeholder-gray-600 text-sm shadow-inner"
              value={ricerca}
              onChange={(e) => { setRicerca(e.target.value); setTendinaAperta(true); }}
              onClick={() => setTendinaAperta(true)}
            />
            {tendinaAperta && ricerca && (
              <ul className="absolute z-50 w-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                {corsiFiltratiSearch.length > 0 ? (
                  corsiFiltratiSearch.map((c, i) => (
                    <li key={i} onClick={() => { setCorsoSelezionato(c); setTendinaAperta(false); }} className="p-4 hover:bg-[#383838] cursor-pointer border-b border-[#333] last:border-none text-xs font-medium text-gray-300">
                      {c.etichetta}
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-xs text-gray-500 text-center font-medium">Nessun corso trovato</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#c48e12]/50 p-5 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-white font-bold leading-tight pr-2">{corsoSelezionato.etichetta}</p>
              <button onClick={() => {setCorsoSelezionato(null); setMaterieTrovate([]);}} className="text-gray-500 hover:text-white p-1 bg-[#2a2a2a] rounded-full"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <Select 
              placeholder="In che anno si trova questo esame?"
              value={annoSelezionato}
              onChange={(val) => {setAnnoSelezionato(val); setMaterieTrovate([]);}}
              options={[...corsoSelezionato.tutti_gli_anni]
                .sort((a: any, b: any) => a.label.localeCompare(b.label))
                .map((a: any) => {
                  const mioCorsoCodice = localStorage.getItem('corsoCodice');
                  const eCorsoBase = (
                    a.codiceCorsoReale === mioCorsoCodice && 
                    a.valore === mioAnnoCodice
                  );
                  return { 
                    valore: a.valore, 
                    label: a.label,
                    disabled: eCorsoBase
                  };
                })
              }
            />

            {annoSelezionato && materieTrovate.length === 0 && !inCaricamento && (
              <button onClick={cercaMaterieNelCorso} className="w-full py-4 rounded-xl font-bold text-sm bg-[#212121] border border-[#c48e12] text-[#c48e12] hover:bg-[#c48e12]/10 transition-colors active:scale-95">
                Trova Materie
              </button>
            )}

            {inCaricamento && (
               <div className="text-center p-4 text-[#c48e12] font-bold text-xs uppercase tracking-widest animate-pulse">
                 ⏳ Scansione in corso...
               </div>
            )}

            {materieTrovate.length > 0 && (
              <div className="mt-4 border-t border-[#333] pt-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Seleziona le materie da seguire:</p>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {materieTrovate.map((materia, idx) => {
                    const annoObj = corsoSelezionato.tutti_gli_anni.find((a: any) => a.valore === annoSelezionato);
                    
                    const giaSalvata = materieSalvate.some(ms => 
                       ms.corsoCodice === annoObj?.codiceCorsoReale && 
                       ms.annoCodice === annoObj?.valore && 
                       ms.materiaNome === materia
                    );

                    if (giaSalvata) {
                      return (
                        <label key={`saved-${idx}`} className="flex items-center gap-3 p-3 rounded-xl border bg-[#1a1a1a] border-[#333] opacity-60 cursor-not-allowed">
                          <input type="checkbox" disabled checked className="w-5 h-5 accent-[#c48e12] rounded opacity-50" />
                          <span className="text-sm font-bold text-gray-500 line-through">{materia}</span>
                          <span className="ml-auto text-[10px] text-[#c48e12] font-bold uppercase tracking-widest">Già Aggiunta</span>
                        </label>
                      );
                    }

                    return (
                      <label key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${materieSpuntate.includes(materia) ? 'bg-[#c48e12]/10 border-[#c48e12]/50' : 'bg-[#2a2a2a] border-[#444]'}`}>
                        <input 
                          type="checkbox" 
                          checked={materieSpuntate.includes(materia)} 
                          onChange={() => toggleSpunta(materia)}
                          className="w-5 h-5 accent-[#c48e12] rounded"
                        />
                        <span className={`text-sm font-bold ${materieSpuntate.includes(materia) ? 'text-[#c48e12]' : 'text-gray-300'}`}>{materia}</span>
                      </label>
                    );
                  })}
                </div>
                
                <button 
                  onClick={salvaEsamiExtra}
                  disabled={materieSpuntate.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${materieSpuntate.length === 0 ? 'bg-[#333] text-gray-500 cursor-not-allowed' : 'bg-[#c48e12] text-[#121212] active:scale-95 shadow-[#c48e12]/20'}`}
                >
                  Aggiungi {materieSpuntate.length > 0 ? materieSpuntate.length : ''} alle Lezioni
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-8"></div>

      <div className="mb-8">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">Esami a scelta selezionati</h3>
        {materieSalvate.length === 0 ? (
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] text-center shadow-inner">
            <p className="text-sm text-gray-500 font-medium">Nessuna materia aggiuntiva inserita.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materieSalvate.map(m => (
              <div key={m.id} className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-between shadow-md">
                <div className="pr-4">
                  <p className="text-sm text-white font-bold leading-tight mb-1">{m.materiaNome}</p>
                  <p className="text-[10px] text-[#c48e12] font-bold uppercase line-clamp-1">{m.corsoNome}</p>
                </div>
                <button onClick={() => eliminaMateriaSalvata(m.id)} className="p-2 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-900/40 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBackupPopup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 items-center justify-center gap-4" onClick={() => setShowBackupPopup(false)}>
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
            <h2 className="text-xl font-black text-white mb-2 tracking-tight">Portabilità Dati</h2>
            
            <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
              Esporta o importa la tua configurazione in un clic.
              <br />
              <span className="text-[#c48e12] font-bold mt-1 block">
                Salva il codice per non perdere i tuoi dati.
              </span>
            </p>

            <div className="space-y-4">
              <button 
                onClick={handleExport}
                className="w-full py-4 rounded-xl font-black text-[#121212] bg-[#c48e12] hover:bg-[#d89e17] active:scale-95 transition-all shadow-lg shadow-[#c48e12]/20"
              >
                Copia Configurazione
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#333]"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-[#212121] px-2 text-gray-500 tracking-widest">Oppure Ripristina</span></div>
              </div>

              <button 
                onClick={handleImport} 
                className="w-full py-4 rounded-xl font-black text-[#c48e12] border border-[#c48e12]/30 hover:bg-[#c48e12]/5 transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Incolla e Ripristina
              </button>

              <button onClick={() => setShowBackupPopup(false)} className="w-full py-3.5 rounded-xl font-bold text-gray-400 bg-transparent hover:text-white transition-colors active:scale-95">
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

      <BottomNavbar activeTab="piano" />
    </div>
  );
}