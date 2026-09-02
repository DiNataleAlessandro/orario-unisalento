import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, GraduationCap, List, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  corso: {
    nome: string;
    annoNome: string;
  };
  materieExtra?: { materiaNome: string }[];
}

interface ProcessedUser {
  id: number;
  corsoPuro: string;
  anno: string;
  materieExtra: string[];
}

export default function Stats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totale_utenti: number;
    corsiMap: Record<string, number>;
    studenti: ProcessedUser[];
    studentiConExtra: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        const corsiMap: Record<string, number> = {};
        const studenti: ProcessedUser[] = [];
        let studentiConExtra = 0;

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
          if (extra.length > 0) {
            studentiConExtra++;
          }

          studenti.push({
            id: index + 1,
            corsoPuro,
            anno,
            materieExtra: extra
          });
        });

        const corsiOrdinati = Object.fromEntries(
          Object.entries(corsiMap).sort(([,a], [,b]) => b - a)
        );

        setStats({
          totale_utenti: data.totale_utenti || 0,
          corsiMap: corsiOrdinati,
          studenti,
          studentiConExtra
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
    s.materieExtra.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-20 p-4">
      {/* Header Pulito */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Statistiche App</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Card Totali - Stile Nativo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
              <Users className="text-blue-500 mb-2" size={28} />
              <div className="text-3xl font-bold">{stats.totale_utenti}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Utenti Totali</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
              <List className="text-amber-500 mb-2" size={28} />
              <div className="text-3xl font-bold">{stats.studentiConExtra}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center">Utenti con Extra</div>
            </div>
          </div>

          {/* Dettaglio Corsi (Sommario Globale come nella v1) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <GraduationCap className="text-indigo-500" />
              <h2 className="font-bold text-lg">Panoramica Corsi</h2>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(stats.corsiMap).map(([corso, count]) => (
                <div key={corso} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate pr-2">{corso}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.max(2, (count / stats.totale_utenti) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dettaglio Singoli Utenti */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Users className="text-emerald-500" />
                <h2 className="font-bold text-lg">Registro Studenti Anonimo</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cerca corso o materia extra..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
              {filteredStudenti?.map((studente) => (
                <div key={studente.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-md font-mono">
                        #{studente.id}
                      </span>
                      {studente.corsoPuro}
                    </div>
                    <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg shrink-0">
                      Anno {studente.anno}
                    </span>
                  </div>
                  
                  {studente.materieExtra.length > 0 ? (
                    <div className="mt-3 pl-2 border-l-2 border-amber-400">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Materie Extra ({studente.materieExtra.length}):</div>
                      <ul className="space-y-1">
                        {studente.materieExtra.map((materia, idx) => (
                          <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span> 
                            {materia}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 dark:text-slate-500 italic mt-2">
                      Nessuna materia extra
                    </div>
                  )}
                </div>
              ))}
              
              {filteredStudenti?.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Nessuno studente trovato per questa ricerca.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center text-red-500 py-10">Errore nel caricamento dei dati</div>
      )}
    </div>
  );
}
