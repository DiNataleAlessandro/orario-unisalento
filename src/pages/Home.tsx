import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Funzione per generare la mail Unisalento
const generaEmailProf = (nomeGrezzo: string) => {
  if (!nomeGrezzo) return '';
  
  // 1. Togliamo HTML, spazi extra e titoli inutili
  let pulito = nomeGrezzo.replace(/<[^>]+>/g, '')
                         .replace(/Prof\.ssa|Prof\.|Dott\.ssa|Dott\./gi, '')
                         .trim()
                         .toLowerCase();
                         
  // 2. Rimuoviamo apostrofi o accenti che rompono la mail (es. D'Amico -> damico)
  pulito = pulito.replace(/[']/g, '')
                 .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                 
  // 3. Uniamo le parole rimaste con il punto
  const parti = pulito.split(/\s+/);
  return `${parti.join('.')}@unisalento.it`;
};

interface Lezione {
  id: string;
  nome_insegnamento: string;
  docente: string;
  orario: string;
  aula: string;
  nome_giorno: string;
  data: string;
  inizioDateObj?: Date;
  fineDateObj?: Date;
}

const formattaDataAPI = (data: Date) => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};

export default function Home() {
  const navigate = useNavigate();
  const corsoCodice = localStorage.getItem('corsoCodice') || '';
  const annoCodice = localStorage.getItem('annoCodice') || '';
  const corsoNome = localStorage.getItem('corsoNome') || '';
  const annoNome = localStorage.getItem('annoNome') || '';

  const [lezioni, setLezioni] = useState<Lezione[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  const dataRiferimento = new Date(); 
  const [fineSettimanaCorrente, setFineSettimanaCorrente] = useState<Date | null>(null);
  const [oraAttuale, setOraAttuale] = useState(new Date());

  const resettaImpostazioni = () => {
    localStorage.clear();
    sessionStorage.clear(); 
    navigate('/onboarding');
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setOraAttuale(new Date());
    }, 60000); 
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const scaricaOrariMultipli = async () => {
      try {
        setInCaricamento(true);
        setErrore(null);

        const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';

        const fetchSettimana = async (dataTarget: Date) => {
          const dataStr = formattaDataAPI(dataTarget);
          const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
          const cachedData = sessionStorage.getItem(cacheKey);
          
          if (cachedData) return JSON.parse(cachedData); 

          const datiModulo = new URLSearchParams();
          datiModulo.append('view', 'easycourse');
          datiModulo.append('form-type', 'corso');
          datiModulo.append('include', 'corso');
          datiModulo.append('txtcurr', '1 - Percorso comune');
          datiModulo.append('anno', '2025'); 
          datiModulo.append('corso', corsoCodice); 
          datiModulo.append('anno2[]', annoCodice); 
          datiModulo.append('visualizzazione_orario', 'cal');
          datiModulo.append('date', dataStr); 
          datiModulo.append('_lang', 'it');
          datiModulo.append('week_grid_type', '-1');
          datiModulo.append('col_cells', '0');
          datiModulo.append('empty_box', '0');
          datiModulo.append('only_grid', '0');
          datiModulo.append('highlighted_date', '0');
          datiModulo.append('all_events', '0');
          datiModulo.append('faculty_group', '0');

          const response = await fetch(urlAPI, {
            method: 'POST',
            body: datiModulo,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
          });

          if (!response.ok) throw new Error(`Errore server: ${response.status}`);
          
          const result = await response.json();
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
          return result;
        };

        const dataProssimaSettimana = new Date(dataRiferimento);
        dataProssimaSettimana.setDate(dataProssimaSettimana.getDate() + 7);

        const [datiSettimanaCorrente, datiSettimanaProssima] = await Promise.all([
          fetchSettimana(dataRiferimento),
          fetchSettimana(dataProssimaSettimana)
        ]);

        let tutteLeCelle: any[] = [];
        if (datiSettimanaCorrente?.celle) tutteLeCelle = [...tutteLeCelle, ...datiSettimanaCorrente.celle];
        if (datiSettimanaProssima?.celle) tutteLeCelle = [...tutteLeCelle, ...datiSettimanaProssima.celle];

        if (datiSettimanaCorrente?.last_day) {
            const [gFine, mFine, aFine] = datiSettimanaCorrente.last_day.split('-');
            setFineSettimanaCorrente(new Date(Number(aFine), Number(mFine) - 1, Number(gFine), 23, 59, 59));
        }

        if (tutteLeCelle.length > 0) {
          const lezioniElaborate: Lezione[] = tutteLeCelle.map((lezione: any) => {
            const [oraInizioStr, oraFineStr] = lezione.orario.split(' - ');
            const [giorno, mese, annoStr] = lezione.data.split('-');
            const [oraInizio, minInizio] = oraInizioStr.split(':');
            const [oraFine, minFine] = oraFineStr.split(':');

            const inizioDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraInizio), Number(minInizio));
            const fineDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraFine), Number(minFine));

            return { ...lezione, inizioDateObj, fineDateObj };
          });

          const lezioniUniche = Array.from(new Map(lezioniElaborate.map(l => [l.id, l])).values());
          lezioniUniche.sort((a, b) => {
             if (!a.inizioDateObj || !b.inizioDateObj) return 0;
             return a.inizioDateObj.getTime() - b.inizioDateObj.getTime();
          });

          setLezioni(lezioniUniche);
        } else {
          setLezioni([]);
        }
      } catch (err) {
        setErrore("Impossibile caricare l'orario. Controlla la connessione.");
      } finally {
        setInCaricamento(false);
      }
    };

    scaricaOrariMultipli();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corsoCodice, annoCodice]);

  const lezioneLiveIndex = lezioni.findIndex(lezione => {
    if (!lezione.inizioDateObj || !lezione.fineDateObj) return false;
    return lezione.inizioDateObj <= oraAttuale && lezione.fineDateObj > oraAttuale;
  });

  const lezioneLive = lezioneLiveIndex !== -1 ? lezioni[lezioneLiveIndex] : null;

  const lezioniFuture = lezioni.filter((lezione, index) => {
      if (index === lezioneLiveIndex) return false;
      if (!lezione.fineDateObj) return true;
      return lezione.fineDateObj > oraAttuale;
  });

  const lezioniQuestaSettimana = lezioniFuture.filter(l => !fineSettimanaCorrente || l.inizioDateObj! <= fineSettimanaCorrente);
  const lezioniProssimaSettimana = lezioniFuture.filter(l => fineSettimanaCorrente && l.inizioDateObj! > fineSettimanaCorrente);

  const CardLezione = ({ lezione }: { lezione: Lezione }) => (
    <div className="bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333] flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#333] rounded-l-2xl"></div>
        <div className="flex justify-between items-start pl-2">
            <h2 className="font-bold text-white text-lg leading-tight w-3/4">
            {lezione.nome_insegnamento.replace(/<[^>]+>/g, '')}
            </h2>
            <span className="bg-[#1a1a1a] text-[#c48e12] border border-[#333] text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center">
            {lezione.nome_giorno}<br/>{lezione.data}
            </span>
        </div>
        <div className="pl-2 flex flex-col gap-1.5 mt-2 text-sm text-gray-400">
            <p className="flex items-center gap-2">
            <span className="opacity-70">🕒</span> <span className="font-medium text-gray-200">{lezione.orario}</span>
            </p>
            <p className="flex items-center gap-2">
            <span className="opacity-70">📍</span> <span className="font-medium">{lezione.aula.replace(/<[^>]+>/g, '')}</span>
            </p>
            <p className="flex items-center gap-2">
            <span className="opacity-70">👨‍🏫</span> <span>{lezione.docente.replace(/<[^>]+>/g, '')}</span>
            </p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] p-4 pb-28 relative">
      <header className="flex justify-between items-center mb-6 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div>
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">L'Agenda</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">
            {corsoNome}
          </p>
        </div>
        <button onClick={resettaImpostazioni} className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl hover:bg-[#2a2a2a] transition-colors text-gray-300 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </header>

      <div className="space-y-4">
        {inCaricamento && (
          <div className="text-center p-10 text-[#c48e12] font-bold text-sm uppercase tracking-widest animate-pulse">
            ⏳ Sincronizzazione...
          </div>
        )}

        {errore && (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-900/50 text-center font-medium text-sm">
            ⚠️ {errore}
          </div>
        )}

        {!inCaricamento && !errore && !lezioneLive && lezioniFuture.length === 0 && (
          <div className="text-center p-10 text-gray-500 font-medium bg-[#212121] rounded-2xl shadow-lg border border-[#333] flex flex-col items-center justify-center gap-3">
            <span className="text-4xl opacity-50">🥂</span>
            <p className="text-sm">Nessuna lezione in programma a breve termine.</p>
          </div>
        )}

        {!inCaricamento && lezioneLive && (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-[#c48e12] uppercase tracking-[0.2em] mb-3 pl-2 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c48e12] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c48e12]"></span>
                    </span>
                    In Corso Ora
                </h3>
                {/* Card Lezione Live con stile Premium */}
                <div className="bg-gradient-to-br from-[#2a2215] to-[#1a150c] p-5 rounded-2xl shadow-xl flex flex-col gap-2 relative overflow-hidden border border-[#c48e12]/30 transform transition-transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start pl-2">
                    <h2 className="font-bold text-white text-xl leading-tight w-3/4">
                        {lezioneLive.nome_insegnamento.replace(/<[^>]+>/g, '')}
                    </h2>
                    <span className="bg-black/40 text-[#c48e12] text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center border border-[#c48e12]/20">
                        {lezioneLive.nome_giorno}<br/>{lezioneLive.data}
                    </span>
                    </div>

                    <div className="pl-2 flex flex-col gap-1.5 mt-2 text-sm text-[#e8d5a5]">
                    <p className="flex items-center gap-2">
                        <span className="opacity-80">🕒</span> <span className="font-bold text-[#c48e12]">{lezioneLive.orario}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="opacity-80">📍</span> <span className="font-medium">
                        {lezioneLive.aula.replace(/<[^>]+>/g, '')}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="opacity-80">👨‍🏫</span> <span className="text-gray-300">
                        {lezioneLive.docente.replace(/<[^>]+>/g, '')}
                        </span>
                    </p>
                    </div>
                </div>
            </div>
        )}

        {!inCaricamento && lezioniQuestaSettimana.length > 0 && (
          <div className="grid gap-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] pl-2 mt-2">
                 {lezioneLive ? "Prossime Oggi" : "In Arrivo"}
             </h3>
            {lezioniQuestaSettimana.map((lezione, index) => (
              <CardLezione key={index} lezione={lezione} />
            ))}
          </div>
        )}

        {!inCaricamento && lezioniProssimaSettimana.length > 0 && (
          <div className="mt-8 mb-4">
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
                <span className="text-[10px] font-black text-[#c48e12] uppercase tracking-[0.2em] bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg">
                    Prossima Settimana
                </span>
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
            </div>
            <div className="grid gap-4 mt-6">
                {lezioniProssimaSettimana.map((lezione, index) => (
                <CardLezione key={index} lezione={lezione} />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Bar Dark Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-xl border-t border-[#333] pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-2 mt-1">
          <button className="flex flex-col items-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">AGENDA</span>
          </button>
          <button onClick={() => navigate('/calendario')} className="flex flex-col items-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">CALENDARIO</span>
          </button>
        </div>
      </div>
    </div>
  );
}