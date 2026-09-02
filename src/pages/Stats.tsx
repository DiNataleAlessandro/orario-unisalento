import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  corso?: {
    nome: string;
    annoNome: string;
  };
  materieExtra?: { materiaNome: string }[];
  blacklist?: string[];
  lezioniSingolePrenotate?: any[];
}

interface ProcessedUser {
  id: number;
  corsoPuro: string;
  anno: string;
  materieExtra: string[];
  blacklist: string[];
  lezioniSingole: number;
}

export default function Stats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totale_utenti: number;
    corsiMap: Record<string, number>;
    studenti: ProcessedUser[];
    studentiConExtra: number;
    studentiConBlacklist: number;
    studentiConLezioniSingole: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        const corsiMap: Record<string, number> = {};
        const studenti: ProcessedUser[] = [];
        let studentiConExtra = 0;
        let studentiConBlacklist = 0;
        let studentiConLezioniSingole = 0;

        data.dati?.forEach((user: UserData, index: number) => {
          let corsoPuro = 'Sconosciuto';
          let anno = '?';

          if (user.corso?.nome) {
            corsoPuro = user.corso.nome.replace(' (Laurea)', '').replace(' (Laurea Magistrale)', '').replace(' (Laurea Magistrale Ciclo Unico 6 anni)', '').trim();
            anno = user.corso.annoNome?.split(' - ')[0] || '?';
            
            const label = `${corsoPuro} (Anno ${anno})`;
            corsiMap[label] = (corsiMap[label] || 0) + 1;
          }
          
          const extra = (user.materieExtra || []).map(m => m.materiaNome);
          if (extra.length > 0) studentiConExtra++;

          const bl = user.blacklist || [];
          if (bl.length > 0) studentiConBlacklist++;

          const singole = user.lezioniSingolePrenotate?.length || 0;
          if (singole > 0) studentiConLezioniSingole++;

          studenti.push({
            id: index + 1,
            corsoPuro,
            anno,
            materieExtra: extra,
            blacklist: bl,
            lezioniSingole: singole
          });
        });

        const corsiOrdinati = Object.fromEntries(
          Object.entries(corsiMap).sort(([,a], [,b]) => b - a)
        );

        setStats({
          totale_utenti: data.totale_utenti || 0,
          corsiMap: corsiOrdinati,
          studenti,
          studentiConExtra,
          studentiConBlacklist,
          studentiConLezioniSingole
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Errore caricamento statistiche', err);
        setLoading(false);
      });
  }, []);

  const filteredStudenti = stats?.studenti.filter(s => 
    s.corsoPuro.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.materieExtra.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.id.toString() === searchQuery
  );

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      <header className="flex justify-between items-center mb-6 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Statistiche</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">
            Dati Globali Anonimi
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl hover:bg-[#2a2a2a] transition-colors text-gray-300 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center p-10 text-[#c48e12] font-bold text-sm uppercase tracking-widest animate-pulse">
          ⏳ Analisi Dati in Corso...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-white">{stats.totale_utenti}</div>
              <div className="text-[10px] font-black text-[#c48e12] uppercase tracking-widest mt-1">Utenti Attivi</div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-white">{stats.studentiConExtra}</div>
              <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Usano Materie Extra</div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-white">{stats.studentiConBlacklist}</div>
              <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-1 text-center">Usano Filtri/Blacklist</div>
            </div>
            <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-xl shadow-inner flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-white">{stats.studentiConLezioniSingole}</div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 text-center">Lezioni Fissate</div>
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg">
                    Panoramica Corsi
                </span>
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
            </div>
            
            <div className="bg-[#212121] rounded-2xl shadow-lg border border-[#333] p-4 space-y-4">
              {Object.entries(stats.corsiMap).map(([corso, count]) => (
                <div key={corso} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-300 pr-2">{corso}</span>
                    <span className="font-black text-[#c48e12]">{count}</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] border border-[#333] rounded-full h-2">
                    <div 
                      className="bg-[#c48e12] h-1.5 rounded-full mt-[1px] ml-[1px] transition-all shadow-[0_0_8px_rgba(196,142,18,0.4)]" 
                      style={{ width: `calc(${Math.max(2, (count / stats.totale_utenti) * 100)}% - 2px)` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg">
                    Registro Dettagliato
                </span>
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
            </div>
            
            <div className="bg-[#212121] rounded-2xl shadow-lg border border-[#333] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#333] bg-[#1a1a1a]">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Cerca corso, extra o ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#c48e12] transition-colors"
                  />
                </div>
              </div>
              
              <div className="divide-y divide-[#333] max-h-[500px] overflow-y-auto">
                {filteredStudenti?.map((studente) => (
                  <div key={studente.id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span className="bg-[#1a1a1a] border border-[#333] text-gray-400 text-[10px] px-2 py-0.5 rounded-lg font-mono">
                          #{studente.id}
                        </span>
                        {studente.corsoPuro}
                      </div>
                      <span className="text-[10px] font-black uppercase bg-[#c48e12]/10 border border-[#c48e12]/40 text-[#c48e12] px-2 py-1 rounded-lg shrink-0">
                        Anno {studente.anno}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap mt-2">
                      {studente.materieExtra.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-[#333] p-2 rounded-lg text-xs text-gray-300 flex-1 min-w-[200px]">
                          <div className="font-bold text-green-500 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Materie Extra ({studente.materieExtra.length})
                          </div>
                          <ul className="pl-2 space-y-1 opacity-80">
                            {studente.materieExtra.map((m, i) => <li key={i}>- {m}</li>)}
                          </ul>
                        </div>
                      )}

                      {studente.blacklist.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-[#333] p-2 rounded-lg text-xs text-gray-300 flex-1 min-w-[200px]">
                          <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            Materie Nascoste ({studente.blacklist.length})
                          </div>
                          <ul className="pl-2 space-y-1 opacity-80">
                            {studente.blacklist.map((m, i) => <li key={i}>- {m}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {studente.lezioniSingole > 0 && (
                        <div className="bg-[#1a1a1a] border border-[#333] p-2 rounded-lg text-xs text-gray-300 flex-1 min-w-[120px]">
                          <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            Fissate
                          </div>
                          <div className="opacity-80">{studente.lezioniSingole} {studente.lezioniSingole === 1 ? 'lezione' : 'lezioni'}</div>
                        </div>
                      )}
                      
                      {studente.materieExtra.length === 0 && studente.blacklist.length === 0 && studente.lezioniSingole === 0 && (
                        <div className="text-[10px] text-gray-600 font-medium italic mt-1 uppercase tracking-wider">
                          Nessuna configurazione avanzata
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredStudenti?.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Nessuno studente trovato per questa ricerca.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center text-red-500 py-10 font-bold bg-red-900/20 border border-red-900/50 rounded-xl mx-4">
          Errore nel caricamento dei dati
        </div>
      )}
    </div>
  );
}
