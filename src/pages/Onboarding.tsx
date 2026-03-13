import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { elenco_corsi } from '../corsiData'; 

export default function Onboarding() {
  const [corso, setCorso] = useState('');
  const [anno, setAnno] = useState('');
  const [listaCorsi, setListaCorsi] = useState<{valore: string, etichetta: string}[]>([]);
  
  // NUOVO STATO: La lista dinamica degli anni/indirizzi
  const [listaAnni, setListaAnni] = useState<{label: string, valore: string}[]>([]);

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

  // 2. EFFETTO MAGICO DINAMICO: Quando l'utente sceglie un corso, aggiorniamo gli anni!
  useEffect(() => {
    if (corso) {
      // Troviamo il corso completo nel nostro database
      const corsoIntero = elenco_corsi.find((c: any) => c.valore === corso);
      
      // Estraiamo i suoi anni/indirizzi specifici (se ne ha)
      if (corsoIntero && corsoIntero.elenco_anni) {
        setListaAnni(corsoIntero.elenco_anni);
      } else {
        setListaAnni([]);
      }
    } else {
      setListaAnni([]);
    }
    // Azzeriamo la tendina dell'anno ogni volta che cambia corso
    setAnno('');
  }, [corso]);

  const salvaImpostazioni = () => {
    if (!corso || !anno) {
      alert("Seleziona sia il corso che l'anno/indirizzo!");
      return;
    }
    
    // Invece di leggere l'HTML, peschiamo i nomi esatti dai nostri dati
    const corsoScelto = listaCorsi.find(c => c.valore === corso);
    const annoScelto = listaAnni.find(a => a.valore === anno);
    
    localStorage.setItem('corsoCodice', corso);
    localStorage.setItem('annoCodice', anno);
    localStorage.setItem('corsoNome', corsoScelto?.etichetta || '');
    localStorage.setItem('annoNome', annoScelto?.label || ''); // Salverà roba tipo "1 - INDIRIZZO STORICO"
    
    sessionStorage.clear();
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Benvenuto!</h1>
          <p className="text-gray-500 mt-2 font-medium">Configura il tuo piano di studi</p>
        </div>

        <div className="space-y-6">
          {/* TENDINA 1: CORSO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Corso di Laurea</label>
            <select 
              id="select-corso"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 outline-none transition-all font-bold text-gray-700 shadow-sm text-sm"
              value={corso}
              onChange={(e) => setCorso(e.target.value)}
            >
              <option value="">Scegli il tuo corso</option>
              {listaCorsi.map((c, i) => (
                <option key={i} value={c.valore}>{c.etichetta}</option>
              ))}
            </select>
          </div>

          {/* TENDINA 2: ANNO / INDIRIZZO (Ora è Dinamica!) */}
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