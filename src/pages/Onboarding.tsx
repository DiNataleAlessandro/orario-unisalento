import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { elenco_corsi } from '../corsiData'; 
import logoUnisalento from '../assets/icona.png'; 

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

  const navigate = useNavigate();

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
    function gestisciClickFuori(event: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(event.target as Node)) {
        setTendinaAperta(false);
      }
    }
    document.addEventListener("mousedown", gestisciClickFuori);
    return () => document.removeEventListener("mousedown", gestisciClickFuori);
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
      alert("Seleziona sia il corso che l'anno/indirizzo!");
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

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-[#212121] p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-[#333333]">
        <div className="text-center mb-8">
          <div className="bg-[#1a1a1a] border border-[#333] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 overflow-hidden shadow-inner">
            <img src={logoUnisalento} alt="Logo UniSalento" className="w-14 h-14 object-contain opacity-90" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Benvenuto!</h1>
          <p className="text-[#c48e12] mt-2 font-bold tracking-wide text-sm uppercase">Configura il tuo piano di studi</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 relative" ref={tendinaRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Cerca il tuo Corso</label>
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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Anno e Indirizzo</label>
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

          <button 
            onClick={salvaImpostazioni}
            className="w-full font-black py-5 rounded-2xl mt-4 transition-all shadow-lg active:scale-95 bg-[#c48e12] text-[#121212] hover:bg-[#d89e17] shadow-[#c48e12]/20"
          >
            Configurazione Completata
          </button>
        </div>
      </div>
    </div>
  );
}