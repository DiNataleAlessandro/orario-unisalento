import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  // Leggiamo i codici veri!
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
    sessionStorage.clear(); // Puliamo la cache!
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

        const urlOriginale = 'https://logistica.unisalento.it/PortaleStudenti/grid_call.php';
        const urlAPI = 'https://corsproxy.io/?' + encodeURIComponent(urlOriginale);

        const fetchSettimana = async (dataTarget: Date) => {
          // SISTEMA DI CACHE: Controlliamo se abbiamo già scaricato questi dati
          const dataStr = formattaDataAPI(dataTarget);
          const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
          const cachedData = sessionStorage.getItem(cacheKey);
          
          if (cachedData) {
            return JSON.parse(cachedData); // Risposta istantanea!
          }

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
          // Salviamo in cache per la prossima volta
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl"></div>
        <div className="flex justify-between items-start pl-2">
            <h2 className="font-bold text-gray-800 text-lg leading-tight w-3/4">
            {lezione.nome_insegnamento.replace(/<[^>]+>/g, '')}
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center">
            {lezione.nome_giorno}<br/>{lezione.data}
            </span>
        </div>
        <div className="pl-2 flex flex-col gap-1 mt-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
            <span>🕒</span> <span className="font-medium">{lezione.orario}</span>
            </p>
            <p className="flex items-center gap-2">
            <span>📍</span> <span className="font-medium">{lezione.aula.replace(/<[^>]+>/g, '')}</span>
            </p>
            <p className="flex items-center gap-2">
            <span>👨‍🏫</span> <span>{lezione.docente.replace(/<[^>]+>/g, '')}</span>
            </p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-28 relative">
      <header className="flex justify-between items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-600">L'Agenda</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
            {corsoNome} • {annoNome}
          </p>
        </div>
        <button onClick={resettaImpostazioni} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors text-xl">
          ⚙️
        </button>
      </header>

      <div className="space-y-4">
        {inCaricamento && (
          <div className="text-center p-10 text-gray-500 font-medium animate-pulse">
            ⏳ Aggiornamento dati...
          </div>
        )}

        {errore && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-medium">
            ⚠️ {errore}
          </div>
        )}

        {!inCaricamento && !errore && !lezioneLive && lezioniFuture.length === 0 && (
          <div className="text-center p-10 text-gray-500 font-medium bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🎉</span>
            <p>Nessuna lezione in programma a breve termine!</p>
          </div>
        )}

        {!inCaricamento && lezioneLive && (
            <div className="mb-6">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    In Corso Ora
                </h3>
                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-5 rounded-2xl shadow-lg flex flex-col gap-2 relative overflow-hidden text-white transform transition-transform hover:scale-[1.02]">
                    <div className="flex justify-between items-start pl-2">
                    <h2 className="font-bold text-xl leading-tight w-3/4">
                        {lezioneLive.nome_insegnamento.replace(/<[^>]+>/g, '')}
                    </h2>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center border border-white/30">
                        {lezioneLive.nome_giorno}<br/>{lezioneLive.data}
                    </span>
                    </div>

                    <div className="pl-2 flex flex-col gap-1 mt-2 text-sm text-red-50">
                    <p className="flex items-center gap-2">
                        <span>🕒</span> <span className="font-bold">{lezioneLive.orario}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span>📍</span> <span className="font-medium">
                        {lezioneLive.aula.replace(/<[^>]+>/g, '')}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span>👨‍🏫</span> <span>
                        {lezioneLive.docente.replace(/<[^>]+>/g, '')}
                        </span>
                    </p>
                    </div>
                </div>
            </div>
        )}

        {!inCaricamento && lezioniQuestaSettimana.length > 0 && (
          <div className="grid gap-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2 mt-2">
                 {lezioneLive ? "Altre lezioni in arrivo" : "In arrivo"}
             </h3>
            {lezioniQuestaSettimana.map((lezione, index) => (
              <CardLezione key={index} lezione={lezione} />
            ))}
          </div>
        )}

        {!inCaricamento && lezioniProssimaSettimana.length > 0 && (
          <div className="mt-8 mb-4">
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300 rounded-full"></div>
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 rounded-md">
                    Prossima Settimana
                </span>
                <div className="flex-1 h-px bg-gray-300 rounded-full"></div>
            </div>
            <div className="grid gap-4 mt-6">
                {lezioniProssimaSettimana.map((lezione, index) => (
                <CardLezione key={index} lezione={lezione} />
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-3">
          <button className="flex flex-col items-center p-2 text-blue-600 transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Agenda</span>
          </button>
          <button onClick={() => navigate('/calendario')} className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold">Calendario</span>
          </button>
        </div>
      </div>
    </div>
  );
}