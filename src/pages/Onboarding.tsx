import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { elenco_corsi } from '../corsiData'; 

export default function Onboarding() {
  const [corso, setCorso] = useState('');
  const [anno, setAnno] = useState('');
  const [listaCorsi, setListaCorsi] = useState<{valore: string, etichetta: string}[]>([]);
  const [listaAnni, setListaAnni] = useState<{label: string, valore: string}[]>([]);

  // NUOVI STATI PER LA RICERCA
  const [ricerca, setRicerca] = useState('');
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // 1. All'avvio, carichiamo la lista di tutti i corsi
  useEffect(() => {
    const mappati = elenco_corsi.map((item: any) => ({
      valore: item.valore,
      etichetta: `${item.label} (${item.tipo})` 
    }));
    mappati.sort((a: any, b: any) => a.etichetta.localeCompare(b.etichetta));
    setListaCorsi(mappati);
  }, []);

  // 2. Chiusura della tendina se si clicca fuori
  useEffect(() => {
    function gestisciClickFuori(event: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(event.target as Node)) {
        setTendinaAperta(false);
      }
    }
    document.addEventListener("mousedown", gestisciClickFuori);
    return () => document.removeEventListener("mousedown", gestisciClickFuori);
  }, []);

  // 3. EFFETTO MAGICO DINAMICO: Quando l'utente sceglie un corso, aggiorniamo gli anni!
  useEffect(() => {
    if (corso) {
      const corsoIntero = elenco_corsi.find((c: any) => c.valore === corso);
      if (corsoIntero && corsoIntero.elenco_anni) {
        setListaAnni(corsoIntero.elenco_anni);
      } else {
        setListaAnni([]);
      }
    } else {
      setListaAnni([]);
    }
    setAnno('');
  }, [corso]);

  // Filtra i corsi in base a ciò che l'utente sta scrivendo
  const corsiFiltrati = listaCorsi.filter(c => 
    c.etichetta.toLowerCase().includes(ricerca.toLowerCase())
  );

  const selezionaCorso = (valoreCorso: string, nomeCorso: string) => {
    setCorso(valoreCorso);
    setRicerca(nomeCorso); // Scrive il nome completo nella barra
    setTendinaAperta(false); // Chiude la tendina
  };

  const gestisciRicerca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRicerca(e.target.value);
    setTendinaAperta(true);
    // Se l'utente cancella o modifica il testo, resettiamo il corso selezionato
    if (corso) setCorso('');
  };

  const salvaImpostazioni = () => {
    if (!corso || !anno) {
      alert("Seleziona sia il corso che l'anno/indirizzo!");
      return;
    }
    
    const corsoScelto = listaCorsi.find(c => c.valore === corso);
    const annoScelto = listaAnni.find(a => a.valore === anno);
    
    localStorage.setItem('corsoCodice', corso);
    localStorage.setItem('annoCodice', anno);
    localStorage.setItem('corsoNome', corsoScelto?.etichetta || '');
    localStorage.setItem('annoNome', annoScelto?.label || ''); 
    
    sessionStorage.clear();
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img src="/icona.png" alt="Logo UniSalento" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Benvenuto!</h1>
          <p className="text-gray-500 mt-2 font-medium">Configura il tuo piano di studi</p>
        </div>

        <div className="space-y-6">
          
          {/* BARRA DI RICERCA CORSO (Il nuovo componente intelligente) */}
          <div className="space-y-2 relative" ref={tendinaRef}>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Cerca il tuo Corso</label>
            <input 
              type="text"
              placeholder="Es. Ingegneria Informatica..."
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 outline-none transition-all font-bold text-gray-700 shadow-sm text-sm"
              value={ricerca}
              onChange={gestisciRicerca}
              onClick={() => setTendinaAperta(true)}
            />
            
            {/* La tendina volante dei risultati */}
            {tendinaAperta && (
              <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                {corsiFiltrati.length > 0 ? (
                  corsiFiltrati.map((c, i) => (
                    <li 
                      key={i} 
                      onClick={() => selezionaCorso(c.valore, c.etichetta)}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none text-sm font-medium text-gray-700 transition-colors"
                    >
                      {c.etichetta}
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-sm text-gray-400 text-center font-medium">Nessun corso trovato</li>
                )}
              </ul>
            )}
          </div>

          {/* TENDINA 2: ANNO / INDIRIZZO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Anno e Indirizzo</label>
            <select 
              className={`w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 outline-none transition-all font-bold text-sm shadow-sm
                ${!corso ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}`}
              value={anno}
              onChange={(e) => setAnno(e.target.value)}
              disabled={!corso}
            >
              <option value="">
                {!corso ? "Prima seleziona un corso 👆" : "Scegli l'anno/indirizzo"}
              </option>
              {listaAnni.map((a, i) => (
                <option key={i} value={a.valore}>{a.label}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={salvaImpostazioni}
            className="w-full font-black py-5 rounded-2xl mt-4 transition-all shadow-lg active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
          >
            Configurazione Completata
          </button>
        </div>
      </div>
    </div>
  );
}