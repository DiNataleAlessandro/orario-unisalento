import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, BookOpen, GraduationCap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  corso: {
    nome: string;
    annoNome: string;
  };
  materieExtra?: any[];
}

export default function Stats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totale_utenti: number;
    corsiMap: Record<string, number>;
    materieExtraTotali: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        const corsiMap: Record<string, number> = {};
        let materieExtra = 0;

        data.dati?.forEach((user: UserData) => {
          // Conteggio per corso e anno
          if (user.corso?.nome) {
            // Estrai nome corso pulito
            const corsoPuro = user.corso.nome.replace(' (Laurea)', '').replace(' (Laurea Magistrale)', '').replace(' (Laurea Magistrale Ciclo Unico 6 anni)', '').trim();
            const anno = user.corso.annoNome?.split(' - ')[0] || '?';
            const label = `${corsoPuro} (Anno ${anno})`;
            
            corsiMap[label] = (corsiMap[label] || 0) + 1;
          }
          
          // Conteggio materie extra
          if (user.materieExtra && user.materieExtra.length > 0) {
            materieExtra += user.materieExtra.length;
          }
        });

        // Ordina la mappa per numero di utenti decrescente
        const corsiOrdinati = Object.fromEntries(
          Object.entries(corsiMap).sort(([,a], [,b]) => b - a)
        );

        setStats({
          totale_utenti: data.totale_utenti || 0,
          corsiMap: corsiOrdinati,
          materieExtraTotali: materieExtra
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Errore caricamento statistiche', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-20 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm"
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
          {/* Card Totali */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
              <Users className="text-blue-500 mb-2" size={28} />
              <div className="text-3xl font-bold">{stats.totale_utenti}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Utenti Attivi</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
              <Star className="text-amber-500 mb-2" size={28} />
              <div className="text-3xl font-bold">{stats.materieExtraTotali}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center">Materie Extra Aggiunte</div>
            </div>
          </div>

          {/* Dettaglio Corsi */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <GraduationCap className="text-indigo-500" />
              <h2 className="font-bold text-lg">Distribuzione Corsi</h2>
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
              
              {Object.keys(stats.corsiMap).length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                  Nessun dato disponibile
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
