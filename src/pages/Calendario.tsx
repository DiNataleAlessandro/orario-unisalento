import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import CardLezione, { type Lezione } from '../components/CardLezione';

const formatDateForAPI = (data: Date) => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};

const parseDataString = (dStr: string) => {
  if (!dStr) return 0;
  const [g, m, a] = dStr.split('-');
  return new Date(Number(a), Number(m)-1, Number(g)).getTime();
};

export default function Calendario() {
  const navigate = useNavigate();
  const corsoCodice = localStorage.getItem('corsoCodice') || '';
  const annoCodice = localStorage.getItem('annoCodice') || '';

  const [lezioniGiorno, setLezioniGiorno] = useState<Lezione[]>([]);
  const [inCaricamento, setInCaricamento] = useState(false);
  const [esportazioneInCorso, setEsportazioneInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const [dataSelezionata, setDataSelezionata] = useState<Date>(new Date());
  const blacklist = JSON.parse(localStorage.getItem('blacklist_materie') || '[]');

  useEffect(() => {
    const fetchDailySchedule = async () => {
      try {
        setInCaricamento(true);
        setErrore(null);
        const dataStr = formatDateForAPI(dataSelezionata);

        const materieExtra = JSON.parse(localStorage.getItem('materieExtra') || '[]');
        const corsiDaScaricare = new Map();
        materieExtra.forEach((m: any) => {
           const key = `${m.corsoCodice}_${m.annoCodice}`;
           if (!corsiDaScaricare.has(key)) corsiDaScaricare.set(key, { corsoCodice: m.corsoCodice, annoCodice: m.annoCodice, materie: [] });
           corsiDaScaricare.get(key).materie.push(m.materiaNome);
        });

        const listaTarget = [
           { corsoCodice, annoCodice, materie: null }, 
           ...Array.from(corsiDaScaricare.values())
        ];

        let celleUnite: any[] = [];
        let datiMancantiOffline = false;

        for (const target of listaTarget) {
            const cacheKeyEsatta = `orario_${target.corsoCodice}_${target.annoCodice}_${dataStr}`;
            const cachedData = localStorage.getItem(cacheKeyEsatta);
            
            let datiTargetJSON = null;
            let trovatoInCache = false;

            if (cachedData) {
                datiTargetJSON = JSON.parse(cachedData);
                trovatoInCache = true;
            } else {
                const prefisso = `orario_${target.corsoCodice}_${target.annoCodice}_`;
                let celleTrovate: any[] = [];
                const targetTime = parseDataString(dataStr);
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefisso)) {
                        try {
                           const dataObj = JSON.parse(localStorage.getItem(key) || '{}');
                           if (dataObj.first_day && dataObj.last_day) {
                              const startTime = parseDataString(dataObj.first_day);
                              const endTime = parseDataString(dataObj.last_day);
                              if (targetTime >= startTime && targetTime <= endTime) {
                                  trovatoInCache = true;
                                  if (dataObj.celle) {
                                      celleTrovate = [...celleTrovate, ...dataObj.celle.filter((c:any) => c.data === dataStr)];
                                  }
                              }
                           }
                        } catch(e) {}
                    }
                }
                if (trovatoInCache) datiTargetJSON = { celle: celleTrovate };
            }

            if (!trovatoInCache) {
                if (!navigator.onLine) {
                    datiMancantiOffline = true;
                } else {
                    const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';
                    const formData = new URLSearchParams();
                    formData.append('view', 'easycourse');
                    formData.append('form-type', 'corso');
                    formData.append('include', 'corso');
                    formData.append('txtcurr', '1 - Percorso comune');
                    formData.append('anno', '2025'); 
                    formData.append('corso', target.corsoCodice); 
                    formData.append('anno2[]', target.annoCodice); 
                    formData.append('visualizzazione_orario', 'cal');
                    formData.append('date', dataStr); 
                    formData.append('_lang', 'it');
                    formData.append('week_grid_type', '-1');
                    formData.append('col_cells', '0');
                    formData.append('empty_box', '0');
                    formData.append('only_grid', '0');

                    const response = await fetch(urlAPI, { method: 'POST', body: formData, headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' } });
                    if (!response.ok) throw new Error("API Request Failed");
                    datiTargetJSON = await response.json();
                    localStorage.setItem(cacheKeyEsatta, JSON.stringify(datiTargetJSON));
                }
            }

            if (datiTargetJSON && datiTargetJSON.celle) {
                let celleDaAggiungere = datiTargetJSON.celle.filter((c:any) => c.data === dataStr);
                if (target.materie) {
                    celleDaAggiungere = celleDaAggiungere.filter((c:any) => target.materie.includes(c.nome_insegnamento.replace(/<[^>]+>/g, '').trim()));
                }
                celleUnite = [...celleUnite, ...celleDaAggiungere];
            }
        }

        if (datiMancantiOffline && celleUnite.length === 0) {
            throw new Error("Dati non disponibili offline per questa data. Connettiti per scaricarli.");
        }

        if (celleUnite.length > 0) {
          const lezioniElaborate: Lezione[] = celleUnite.map((lezione: any) => {
            const [oraInizioStr, oraFineStr] = lezione.orario.split(' - ');
            const [giorno, mese, annoStr] = lezione.data.split('-');
            const [oraInizio, minInizio] = oraInizioStr.split(':');
            const [oraFine, minFine] = oraFineStr.split(':');
            const inizioDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraInizio), Number(minInizio));
            const fineDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraFine), Number(minFine));
            
            const cleanMail = lezione.mail_docente ? lezione.mail_docente.split(',').map((m: string) => m.trim()).filter(Boolean).join(',') : '';
            return { ...lezione, inizioDateObj, fineDateObj, mail_docente: cleanMail };
          });

          const lezioniDelGiorno = lezioniElaborate.filter(l => !blacklist.includes(l.nome_insegnamento.replace(/<[^>]+>/g, '').trim()));
          
          const uniqueLessons = Array.from(new Map(lezioniDelGiorno.map(l => [l.id, l])).values());
          uniqueLessons.sort((a, b) => {
             if (!a.inizioDateObj || !b.inizioDateObj) return 0;
             return a.inizioDateObj.getTime() - b.inizioDateObj.getTime();
          });

          setLezioniGiorno(uniqueLessons);
        } else {
          setLezioniGiorno([]);
        }
      } catch (err: any) {
        setErrore(err.message);
      } finally {
        setInCaricamento(false);
      }
    };

    fetchDailySchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corsoCodice, annoCodice, dataSelezionata]);

  // Crawler attivo per scaricare l'intero semestre (passato e futuro)
  const esportaInteroCalendario = async () => {
    if (!navigator.onLine) {
      alert("Devi essere online per scaricare il calendario dell'intero semestre.");
      return;
    }

    setEsportazioneInCorso(true);

    try {
      const materieExtra = JSON.parse(localStorage.getItem('materieExtra') || '[]');
      const mapCorsi = new Map();
      mapCorsi.set(`${corsoCodice}_${annoCodice}`, { isMain: true, materie: [] });

      materieExtra.forEach((m: any) => {
         const k = `${m.corsoCodice}_${m.annoCodice}`;
         if (!mapCorsi.has(k)) mapCorsi.set(k, { isMain: false, materie: [] });
         mapCorsi.get(k).materie.push(m.materiaNome);
      });

      // Creiamo un range di date: 15 settimane nel passato, 15 nel futuro rispetto a oggi
      const dateTarget: string[] = [];
      const dataRiferimento = new Date();
      for (let i = -15; i <= 15; i++) {
        const d = new Date(dataRiferimento);
        d.setDate(d.getDate() + (i * 7));
        dateTarget.push(formatDateForAPI(d));
      }

      let tutteCelle: any[] = [];
      const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';

      // Facciamo le chiamate in sequenza
      for (const targetDate of dateTarget) {
        for (const [keyCorsoAnno, config] of mapCorsi.entries()) {
          const [cCodice, aCodice] = keyCorsoAnno.split('_');

          const formData = new URLSearchParams();
          formData.append('view', 'easycourse');
          formData.append('form-type', 'corso');
          formData.append('include', 'corso');
          formData.append('txtcurr', '1 - Percorso comune');
          formData.append('anno', '2025');
          formData.append('corso', cCodice);
          formData.append('anno2[]', aCodice);
          formData.append('visualizzazione_orario', 'cal');
          formData.append('date', targetDate);
          formData.append('_lang', 'it');
          formData.append('week_grid_type', '-1');
          formData.append('col_cells', '0');
          formData.append('empty_box', '0');
          formData.append('only_grid', '0');

          try {
            const response = await fetch(urlAPI, {
              method: 'POST',
              body: formData,
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
            });
            if (response.ok) {
              const result = await response.json();
              if (result && result.celle) {
                let celleValide = result.celle;
                if (!config.isMain) {
                  celleValide = celleValide.filter((c: any) => config.materie.includes(c.nome_insegnamento.replace(/<[^>]+>/g, '').trim()));
                }
                tutteCelle = [...tutteCelle, ...celleValide];
              }
            }
          } catch (e) {
            console.error(`Errore nel recupero dati per la data ${targetDate}`, e);
          }
        }
      }

      if (tutteCelle.length === 0) {
          alert("Nessun dato trovato per il semestre.");
          return;
      }

      // CORREZIONE QUI: Protezione contro eventi malformati
      const lezioniElaborate: Lezione[] = tutteCelle.map((lezione: any) => {
        try {
          // Filtro antiproiettile: se mancano i pezzi fondamentali o l'orario non è nel formato "XX:XX - YY:YY", la scartiamo
          if (!lezione || !lezione.orario || typeof lezione.orario !== 'string' || !lezione.orario.includes(' - ') || !lezione.data) {
              return null;
          }

          const [oraInizioStr, oraFineStr] = lezione.orario.split(' - ');
          const [giorno, mese, annoStr] = lezione.data.split('-');
          const [oraInizio, minInizio] = oraInizioStr.split(':');
          const [oraFine, minFine] = oraFineStr.split(':');
          
          const inizioDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraInizio), Number(minInizio));
          const fineDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraFine), Number(minFine));
          
          const cleanMail = lezione.mail_docente ? lezione.mail_docente.split(',').map((m: string) => m.trim()).filter(Boolean).join(',') : '';
          return { ...lezione, inizioDateObj, fineDateObj, mail_docente: cleanMail };
        } catch (err) {
          // Fallback silenzioso
          return null;
        }
      }).filter(Boolean); // Questo rimuove automaticamente tutti i "null" dall'array risultante

      const lezioniFiltrate = lezioniElaborate.filter(l => !blacklist.includes(l.nome_insegnamento.replace(/<[^>]+>/g, '').trim()));
      
      const mappaUnici = new Map();
      lezioniFiltrate.forEach(l => {
        const uniqueKey = `${l.id}_${l.data}_${l.orario}`;
        if (!mappaUnici.has(uniqueKey)) {
          mappaUnici.set(uniqueKey, l);
        }
      });

      const lezioniUniche = Array.from(mappaUnici.values()) as Lezione[];
      lezioniUniche.sort((a, b) => {
         if (!a.inizioDateObj || !b.inizioDateObj) return 0;
         return a.inizioDateObj.getTime() - b.inizioDateObj.getTime();
      });

      let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//NextLesson UniSalento//IT\r\n";

      lezioniUniche.forEach(lezione => {
        if (!lezione.inizioDateObj || !lezione.fineDateObj) return;

        const start = lezione.inizioDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = lezione.fineDateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const summary = lezione.nome_insegnamento.replace(/<[^>]+>/g, '').trim();
        const location = lezione.aula.replace(/<[^>]+>/g, '').trim();
        const description = `Docente: ${lezione.docente.replace(/<[^>]+>/g, '').trim()}`;

        icsContent += "BEGIN:VEVENT\r\n";
        icsContent += `UID:${lezione.id}-${start}@nextlesson\r\n`;
        icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}\r\n`;
        icsContent += `DTSTART:${start}\r\n`;
        icsContent += `DTEND:${end}\r\n`;
        icsContent += `SUMMARY:${summary}\r\n`;
        icsContent += `LOCATION:${location}\r\n`;
        icsContent += `DESCRIPTION:${description}\r\n`;
        icsContent += "END:VEVENT\r\n";
      });

      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `Calendario_Semestre_UniSalento.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error(error);
      alert("Si è verificato un errore durante l'esportazione.");
    } finally {
      setEsportazioneInCorso(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      
      <header className="flex justify-between items-center mb-6 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Calendario</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
            Scegli una data
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={esportaInteroCalendario} 
            disabled={esportazioneInCorso}
            className={`bg-[#1a1a1a] border border-[#333] p-3 rounded-xl transition-colors shadow-inner flex items-center justify-center
              ${esportazioneInCorso ? 'opacity-50 cursor-not-allowed text-gray-500' : 'hover:bg-[#2a2a2a] text-gray-300 active:scale-95'}`}
            title="Esporta Intero Semestre"
          >
            {esportazioneInCorso ? (
              <svg className="animate-spin w-5 h-5 text-[#c48e12]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="bg-[#1a1a1a] p-4 rounded-3xl shadow-inner border border-[#333] mb-6 flex justify-center overflow-hidden">
        <DayPicker 
          mode="single" 
          selected={dataSelezionata} 
          onSelect={(giorno) => giorno && setDataSelezionata(giorno)}
          locale={it} 
          showOutsideDays 
          className="font-sans" 
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-[#c48e12] uppercase tracking-[0.2em] pl-2 mb-2">
          Lezioni del {format(dataSelezionata, "dd MMMM yyyy", { locale: it })}
        </h3>

        {inCaricamento && (
          <div className="text-center p-10 text-[#c48e12] font-bold text-sm uppercase tracking-widest animate-pulse">
            ⏳ Ricerca in corso...
          </div>
        )}

        {errore && (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-900/50 text-center font-medium text-sm">
            ⚠️ {errore}
          </div>
        )}

        {!inCaricamento && !errore && lezioniGiorno.length === 0 && (
          <div className="text-center p-10 text-gray-500 font-medium bg-[#212121] rounded-2xl shadow-lg border border-[#333] flex flex-col items-center justify-center gap-3">
            <span className="text-4xl opacity-50">🏖️</span>
            <p className="text-sm">Nessuna lezione in questa data!</p>
          </div>
        )}

        {!inCaricamento && lezioniGiorno.length > 0 && (
          <div className="grid gap-4">
            {lezioniGiorno.map((lezione, index) => (
              <CardLezione key={index} lezione={lezione} isLive={false} />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-xl border-t border-[#333] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.7)] z-50">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center p-2 mt-1">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">LEZIONI</span>
          </button>
          
          <button onClick={() => navigate('/piano-di-studi')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">CORSI</span>
          </button>

          <button className="flex flex-col items-center justify-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zM14.25 15h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zM16.5 15h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">CALENDARIO</span>
          </button>
        </div>
      </div>
    </div>
  );
}