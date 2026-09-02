import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Star, GraduationCap, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  corso: {
    nome: string;
    annoNome: string;
  };
  materieExtra?: { materiaNome: string }[];
}

export default function Stats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totale_utenti: number;
    corsiMap: Record<string, number>;
    anniMap: Record<string, number>;
    topMaterieExtra: { nome: string, count: number }[];
    materieExtraTotali: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        const corsiMap: Record<string, number> = {};
        const anniMap: Record<string, number> = {};
        const materieExtraMap: Record<string, number> = {};
        let materieExtraCount = 0;

        data.dati?.forEach((user: UserData) => {
          if (user.corso?.nome) {
            const corsoPuro = user.corso.nome.replace(/ \(Laurea.*\)/, '').trim();
            const annoMatch = user.corso.annoNome?.match(/^(\d)/);
            const anno = annoMatch ? `${annoMatch[1]}° Anno` : 'Altro';
            
            // Stats Corsi
            corsiMap[corsoPuro] = (corsiMap[corsoPuro] || 0) + 1;
            // Stats Anni
            anniMap[anno] = (anniMap[anno] || 0) + 1;
          }
          
          if (user.materieExtra?.length) {
            materieExtraCount += user.materieExtra.length;
            user.materieExtra.forEach(m => {
              materieExtraMap[m.materiaNome] = (materieExtraMap[m.materiaNome] || 0) + 1;
            });
          }
        });

        const sortMap = (map: Record<string, number>) => Object.fromEntries(Object.entries(map).sort(([,a], [,b]) => b - a));
        
        const topMaterieExtra = Object.entries(materieExtraMap)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([nome, count]) => ({ nome, count }));

        setStats({
          totale_utenti: data.totale_utenti || 0,
          corsiMap: sortMap(corsiMap),
          anniMap: sortMap(anniMap),
          topMaterieExtra,
          materieExtraTotali: materieExtraCount
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pb-20 font-sans selection:bg-blue-500/30">
      
      {/* Premium Header with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white pt-12 pb-24 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all shadow-sm">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm font-medium tracking-wide">Live Data</span>
          </div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">NextLesson Analytics</h1>
          <p className="text-blue-100/80 font-medium">Monitoraggio globale degli studenti UniSalento.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 -mt-10">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        </div>
      ) : stats ? (
        <div className="px-4 -mt-16 relative z-20 space-y-6 max-w-4xl mx-auto">
          
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/40 dark:border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
              <Users className="text-blue-500 mb-3 relative z-10" size={32} />
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 relative z-10">{stats.totale_utenti}</div>
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 relative z-10 uppercase tracking-wider">Utenti Attivi</div>
            </div>
            
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/40 dark:border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/10 rounded-br-full transition-transform group-hover:scale-110"></div>
              <Star className="text-purple-500 mb-3 relative z-10" size={32} />
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 relative z-10">{stats.materieExtraTotali}</div>
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 relative z-10 uppercase tracking-wider text-center">Materie Extra</div>
            </div>
          </div>

          {/* Nuova Sezione: Distribuzione per Anno */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <Calendar className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Studenti per Anno</h2>
              </div>
            </div>
            <div className="p-5 flex gap-4">
              {Object.entries(stats.anniMap).map(([anno, count]) => (
                <div key={anno} className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col items-center border border-slate-100 dark:border-slate-800">
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200 mb-1">{count}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{anno}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Corsi di Laurea */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                  <GraduationCap className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Distribuzione Corsi</h2>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {Object.entries(stats.corsiMap).map(([corso, count]) => (
                <div key={corso} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300 pr-2">{corso}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.max(2, (count / stats.totale_utenti) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materie Extra Popolari */}
          {stats.topMaterieExtra.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
              <div className="p-5 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-100 dark:bg-pink-900/40 rounded-xl">
                    <TrendingUp className="text-pink-600 dark:text-pink-400" size={20} />
                  </div>
                  <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Top Materie Extra</h2>
                </div>
              </div>
              <div className="p-3">
                {stats.topMaterieExtra.map((materia, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-black text-slate-400 dark:text-slate-500">#{i+1}</div>
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate">{materia.nome}</span>
                    </div>
                    <span className="flex-shrink-0 font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-2 py-1 rounded-lg text-xs ml-2">
                      {materia.count} {materia.count === 1 ? 'studente' : 'studenti'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center text-red-500 py-10">Errore nel caricamento dei dati</div>
      )}
    </div>
  );
}
