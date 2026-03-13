import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardLezione, { type Lezione } from '../components/CardLezione';

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

  const [lezioni, setLezioni] = useState<Lezione[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<string | null>(localStorage.getItem('ultimoAggiornamento'));
  const [refreshCount, setRefreshCount] = useState(0);

  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>(JSON.parse(localStorage.getItem('blacklist_materie') || '[]'));

  const dataRiferimento = new Date(); 
  const [fineSettimanaCorrente, setFineSettimanaCorrente] = useState<Date | null>(null);
  const [oraAttuale, setOraAttuale] = useState(new Date());

  const resettaImpostazioni = () => {
    localStorage.clear();
    sessionStorage.clear(); 
    navigate('/onboarding');
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        const isForced = refreshCount > 0; 

        const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';

        const fetchSettimana = async (dataTarget: Date) => {
          const dataStr = formattaDataAPI(dataTarget);
          const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
          const cachedData = localStorage.getItem(cacheKey); 
          
          if (cachedData && !isForced) {
            return JSON.parse(cachedData); 
          }

          if (!navigator.onLine) {
            if (cachedData) return JSON.parse(cachedData);
            throw new Error("Sei offline e non ci sono dati salvati in memoria.");
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
          localStorage.setItem(cacheKey, JSON.stringify(result));
          
          const now = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('ultimoAggiornamento', now);
          setUltimoAggiornamento(now);

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

            const mailPulita = lezione.mail_docente 
              ? lezione.mail_docente.split(',').map((m: string) => m.trim()).filter(Boolean).join(',')
              : '';

            return { ...lezione, inizioDateObj, fineDateObj, mail_docente: mailPulita };
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
        setErrore("Impossibile scaricare i dati. Controlla la connessione.");
      } finally {
        setInCaricamento(false);
      }
    };

    scaricaOrariMultipli();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corsoCodice, annoCodice, refreshCount]);

  const materieUniche = Array.from(new Set(lezioni.map(l => l.nome_insegnamento.replace(/<[^>]+>/g, '')))).sort();

  const toggleMateria = (materia: string) => {
    let nuovaBlacklist = [...blacklist];
    if (nuovaBlacklist.includes(materia)) {
      nuovaBlacklist = nuovaBlacklist.filter(m => m !== materia);
    } else {
      nuovaBlacklist.push(materia);
    }
    setBlacklist(nuovaBlacklist);
    localStorage.setItem('blacklist_materie', JSON.stringify(nuovaBlacklist));
  };

  const lezioniFiltrate = lezioni.filter(l => !blacklist.includes(l.nome_insegnamento.replace(/<[^>]+>/g, '')));

  const lezioneLiveIndex = lezioniFiltrate.findIndex(lezione => {
    if (!lezione.inizioDateObj || !lezione.fineDateObj) return false;
    return lezione.inizioDateObj <= oraAttuale && lezione.fineDateObj > oraAttuale;
  });

  const lezioneLive = lezioneLiveIndex !== -1 ? lezioniFiltrate[lezioneLiveIndex] : null;

  const lezioniFuture = lezioniFiltrate.filter((lezione, index) => {
      if (index === lezioneLiveIndex) return false;
      if (!lezione.fineDateObj) return true;
      return lezione.fineDateObj > oraAttuale;
  });

  const lezioniQuestaSettimana = lezioniFuture.filter(l => !fineSettimanaCorrente || l.inizioDateObj! <= fineSettimanaCorrente);
  const lezioniProssimaSettimana = lezioniFuture.filter(l => fineSettimanaCorrente && l.inizioDateObj! > fineSettimanaCorrente);

  const raggruppaPerGiorno = (listaLezioni: Lezione[]) => {
    const gruppi = new Map<string, Lezione[]>();
    listaLezioni.forEach(l => {
      const chiave = `${l.nome_giorno} ${l.data}`;
      if (!gruppi.has(chiave)) {
        gruppi.set(chiave, []);
      }
      gruppi.get(chiave)!.push(l);
    });
    return Array.from(gruppi.entries());
  };

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      <header className="flex justify-between items-center mb-4 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">L'Agenda</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">
            {corsoNome}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={resettaImpostazioni} className="bg-[#1a1a1a] border border-[#333] w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[#2a2a2a] transition-colors text-gray-300 active:scale-95 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
             <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between bg-[#1a1a1a] border border-[#333] p-3 rounded-xl shadow-inner">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {!isOffline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isOffline ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'}`}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white tracking-widest uppercase">
              {isOffline ? 'Modalità Offline' : 'Connesso'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium mt-0.5">
              {ultimoAggiornamento ? `Dati del ${ultimoAggiornamento}` : 'Nessun dato salvato'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (isOffline) alert("Sei offline! Connettiti per sincronizzare l'orario.");
            else setRefreshCount(c => c + 1);
          }}
          disabled={inCaricamento || isOffline}
          className={`p-2 rounded-lg transition-all ${inCaricamento || isOffline ? 'opacity-30 cursor-not-allowed' : 'bg-[#2a2a2a] hover:bg-[#333] active:scale-95 border border-[#444] text-[#c48e12] shadow-lg'}`}
          title="Forza Sincronizzazione"
        >
          <svg className={`w-5 h-5 ${inCaricamento ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => setShowBlacklist(true)} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
            blacklist.length > 0 
              ? 'bg-[#c48e12]/10 border-[#c48e12]/40 text-[#c48e12]' 
              : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#212121] hover:text-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {blacklist.length > 0 ? `${blacklist.length} Filtri Attivi` : 'Nascondi Materie'}
        </button>
      </div>

      <div className="space-y-4">
        {inCaricamento && refreshCount === 0 && (
          <div className="text-center p-10 text-[#c48e12] font-bold text-sm uppercase tracking-widest animate-pulse">
            ⏳ Caricamento iniziale...
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
                <CardLezione lezione={lezioneLive} isLive={true} />
            </div>
        )}

        {!inCaricamento && lezioniQuestaSettimana.length > 0 && (
          <div className="mt-8">
            {raggruppaPerGiorno(lezioniQuestaSettimana).map(([giorno, lezioniGiorno], index) => (
              <div key={index} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-black text-[#c48e12] uppercase tracking-widest">
                    {giorno}
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-[#c48e12]/40 to-transparent"></div>
                </div>
                
                <div className="grid gap-4">
                  {lezioniGiorno.map((lezione, idx) => (
                    <CardLezione key={idx} lezione={lezione} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!inCaricamento && lezioniProssimaSettimana.length > 0 && (
          <div className="mt-12 mb-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-[#1a1a1a] border border-[#333] px-3 py-1 rounded-lg">
                    Prossima Settimana
                </span>
                <div className="flex-1 h-px bg-[#333] rounded-full"></div>
            </div>
            
            {raggruppaPerGiorno(lezioniProssimaSettimana).map(([giorno, lezioniGiorno], index) => (
              <div key={index} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-black text-[#c48e12] uppercase tracking-widest">
                    {giorno}
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-[#c48e12]/40 to-transparent"></div>
                </div>
                
                <div className="grid gap-4">
                  {lezioniGiorno.map((lezione, idx) => (
                    <CardLezione key={idx} lezione={lezione} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBlacklist && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 transition-opacity">
          <div className="bg-[#212121] border border-[#333] rounded-[2rem] shadow-2xl w-full max-w-md mx-auto flex flex-col h-[85vh] overflow-hidden mt-8">
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
              <div>
                <h2 className="text-xl font-black text-white">Nascondi Materie</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium">Tocca una materia per nasconderla dall'agenda.</p>
              </div>
              <button onClick={() => setShowBlacklist(false)} className="bg-[#2a2a2a] p-2 rounded-full text-gray-400 hover:text-white active:scale-95 border border-[#444]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {materieUniche.length === 0 ? (
                <p className="text-center text-gray-500 mt-10 text-sm">Nessuna materia caricata.</p>
              ) : (
                materieUniche.map((materia, idx) => {
                  const isNascosta = blacklist.includes(materia);
                  return (
                    <button 
                      key={idx}
                      onClick={() => toggleMateria(materia)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                        isNascosta 
                          ? 'bg-[#1a1a1a] border-[#333] opacity-60' 
                          : 'bg-gradient-to-r from-[#2a2215] to-[#212121] border-[#c48e12]/30 shadow-md'
                      }`}
                    >
                      <span className={`font-bold pr-4 ${isNascosta ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {materia}
                      </span>
                      {isNascosta ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-[#c48e12] shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333]">
              <button 
                onClick={() => setShowBlacklist(false)}
                className="w-full font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 bg-[#c48e12] text-[#121212] shadow-[#c48e12]/20"
              >
                Applica Filtri
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-xl border-t border-[#333] pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-2 mt-1">
          <button className="flex flex-col items-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">AGENDA</span>
          </button>
          <button onClick={() => navigate('/calendario')} className="flex flex-col items-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
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