import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { elenco_corsi } from '../corsiData';

const formatDateForAPI = (data: Date) => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};

export default function PianoDiStudi() {
  const navigate = useNavigate();
  
  const [materieSalvate, setMaterieSalvate] = useState<{ id: string, corsoCodice: string, annoCodice: string, corsoNome: string, materiaNome: string }[]>(JSON.parse(localStorage.getItem('materieExtra') || '[]'));
  
  const [listaCorsiGlobali, setListaCorsiGlobali] = useState<any[]>([]);
  const [ricerca, setRicerca] = useState('');
  const [corsoSelezionato, setCorsoSelezionato] = useState<any>(null);
  const [annoSelezionato, setAnnoSelezionato] = useState('');
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  const [inCaricamento, setInCaricamento] = useState(false);
  const [materieTrovate, setMaterieTrovate] = useState<string[]>([]);
  const [materieSpuntate, setMaterieSpuntate] = useState<string[]>([]);

  // Stati per Backup & Ripristino
  const [showBackupPopup, setShowBackupPopup] = useState(false);
  const [importString, setImportString] = useState('');
  
  // Stato per le notifiche personalizzate (Toast)
  const [toast, setToast] = useState<{ messaggio: string; tipo: 'success' | 'error' } | null>(null);

  // Helper per mostrare il toast e nasconderlo dopo 3 secondi
  const showToast = (messaggio: string, tipo: 'success' | 'error') => {
    setToast({ messaggio, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const corsiMap = new Map();
    elenco_corsi.forEach((item: any) => {
      const chiave = `${item.label} (${item.tipo})`;
      if (!corsiMap.has(chiave)) corsiMap.set(chiave, { etichetta: chiave, anni: [] });
      const corso = corsiMap.get(chiave);
      (item.elenco_anni || []).forEach((a: any) => {
        if (!corso.anni.find((x: any) => x.label === a.label)) {
          corso.anni.push({ label: a.label, valore: a.valore, codiceReale: item.valore });
        }
      });
    });
    setListaCorsiGlobali(Array.from(corsiMap.values()).sort((a,b) => a.etichetta.localeCompare(b.etichetta)));
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(e.target as Node)) setTendinaAperta(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const cercaMaterieNelCorso = async () => {
    if (!corsoSelezionato || !annoSelezionato) return;
    const annoObj = corsoSelezionato.anni.find((a: any) => a.valore === annoSelezionato);
    if (!annoObj) return;

    setInCaricamento(true);
    setMaterieTrovate([]);
    setMaterieSpuntate([]);

    try {
      const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';
      
      const fetchWeek = async (dataTarget: Date) => {
        const formData = new URLSearchParams();
        formData.append('view', 'easycourse');
        formData.append('form-type', 'corso');
        formData.append('include', 'corso');
        formData.append('txtcurr', '1 - Percorso comune');
        formData.append('anno', '2025'); 
        formData.append('corso', annoObj.codiceReale); 
        formData.append('anno2[]', annoObj.valore); 
        formData.append('visualizzazione_orario', 'cal');
        formData.append('date', formatDateForAPI(dataTarget)); 
        formData.append('_lang', 'it');
        formData.append('week_grid_type', '-1');
        formData.append('col_cells', '0');
        formData.append('empty_box', '0');
        formData.append('only_grid', '0');

        const response = await fetch(urlAPI, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' } });
        if (!response.ok) throw new Error("API Request Failed");
        return await response.json();
      };

      const dataOggi = new Date();
      const dataProssima = new Date(); dataProssima.setDate(dataProssima.getDate() + 7);
      const dataTraDue = new Date(); dataTraDue.setDate(dataTraDue.getDate() + 14);

      const [res1, res2, res3] = await Promise.all([ fetchWeek(dataOggi), fetchWeek(dataProssima), fetchWeek(dataTraDue) ]);
      
      let allCells: any[] = [];
      if (res1?.celle) allCells = [...allCells, ...res1.celle];
      if (res2?.celle) allCells = [...allCells, ...res2.celle];
      if (res3?.celle) allCells = [...allCells, ...res3.celle];

      const uniqueSubjects = Array.from(new Set(allCells.map((c: any) => c.nome_insegnamento.replace(/<[^>]+>/g, '')))).sort();
      setMaterieTrovate(uniqueSubjects);
    } catch (e) {
      showToast("📶 Errore di connessione. Riprova più tardi.", "error");
    } finally {
      setInCaricamento(false);
    }
  };

  const toggleSpunta = (materia: string) => {
    if (materieSpuntate.includes(materia)) {
      setMaterieSpuntate(materieSpuntate.filter(m => m !== materia));
    } else {
      setMaterieSpuntate([...materieSpuntate, materia]);
    }
  };

  const salvaEsamiExtra = () => {
    const annoObj = corsoSelezionato.anni.find((a: any) => a.valore === annoSelezionato);
    
    const nuoviSalvataggi = materieSpuntate
      .filter(materia => !materieSalvate.some(ms => 
         ms.corsoCodice === annoObj.codiceReale && 
         ms.annoCodice === annoObj.valore && 
         ms.materiaNome === materia
      ))
      .map(materia => ({
        id: Date.now().toString() + Math.random().toString(),
        corsoCodice: annoObj.codiceReale,
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

  // Logica Backup (Esporta) COMPATTA & SICURA
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

  // Logica Ripristino (Importa) COMPATTA & SICURA
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

        // Corretti i tipi per TypeScript
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
      showToast("⚠️ Codice non valido. Controlla e riprova.", "error");
    }
  };

  const corsiFiltratiSearch = listaCorsiGlobali.filter(c => c.etichetta.toLowerCase().includes(ricerca.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-300 w-[90%] max-w-sm text-center ${
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
        
        {!corsoSelezionato ? (
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
            
            <select 
              className="w-full bg-[#2a2a2a] border border-[#444] focus:border-[#c48e12] rounded-xl p-4 outline-none transition-all font-bold text-xs text-white appearance-none mb-4"
              value={annoSelezionato}
              onChange={(e) => {setAnnoSelezionato(e.target.value); setMaterieTrovate([]);}}
            >
              <option value="" className="text-gray-500">In che anno si trova questo esame?</option>
              {corsoSelezionato.anni.map((a: any, i: number) => (
                <option key={i} value={a.valore}>{a.label}</option>
              ))}
            </select>

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
                    const annoObj = corsoSelezionato.anni.find((a: any) => a.valore === annoSelezionato);
                    const giaSalvata = materieSalvate.some(ms => 
                       ms.corsoCodice === annoObj?.codiceReale && 
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

      {/* POPUP BACKUP & RIPRISTINO */}
      {showBackupPopup && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 items-center justify-center" onClick={() => setShowBackupPopup(false)}>
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
              Esporta la configurazione o incollane una esistente. <br />
              <span className="text-[#c48e12] font-bold">Consiglio: salva il codice in un posto sicuro!</span>
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
                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-[#212121] px-2 text-gray-500 tracking-widest">Oppure Importa</span></div>
              </div>

              <textarea 
                value={importString}
                onChange={(e) => setImportString(e.target.value)}
                placeholder="Incolla qui la stringa di backup..."
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl p-3 text-xs text-gray-300 focus:outline-none focus:border-[#c48e12] h-20 resize-none font-mono"
              />

              <div className="flex gap-3">
                <button onClick={() => setShowBackupPopup(false)} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#333] hover:bg-[#444] transition-colors active:scale-95">
                  Annulla
                </button>
                <button onClick={handleImport} className="flex-1 py-3.5 rounded-xl font-black text-[#c48e12] border border-[#c48e12]/30 hover:bg-[#c48e12]/5 transition-colors active:scale-95">
                  Importa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-xl border-t border-[#333] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.7)] z-50">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center p-2 mt-1">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">LEZIONI</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">PIANO DI STUDI</span>
          </button>

          <button onClick={() => navigate('/calendario')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">CALENDARIO</span>
          </button>
        </div>
      </div>
    </div>
  );
}