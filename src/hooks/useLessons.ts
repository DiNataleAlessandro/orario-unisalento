import { useState, useEffect, useCallback } from 'react';
import type { Lezione } from '@/types/lezione';
import { fetchSingleWeek } from '@/api/unisalento';
import { cleanHtmlTags, isValidLesson, isAnnullata } from '@/api/transformers';

interface UseLessonsProps {
  corsoCodice: string;
  annoCodice: string;
  refreshCount: number;
}

export const useLessons = ({ corsoCodice, annoCodice, refreshCount }: UseLessonsProps) => {
  const [lezioni, setLezioni] = useState<Lezione[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<string | null>(localStorage.getItem('ultimoAggiornamento'));
  const [fineSettimanaCorrente, setFineSettimanaCorrente] = useState<Date | null>(null);

  const fetchAllCoursesForDate = useCallback(async (dataTarget: Date, isForced: boolean) => {
    const mainRes = await fetchSingleWeek({ dataTarget, corsoCodice, annoCodice, isForced });
    let mergedCells: any[] = mainRes?.celle ? [...mainRes.celle] : [];

    const materieExtra = JSON.parse(localStorage.getItem('materieExtra') || '[]');
    const corsiToDownload = new Map();
    
    materieExtra.forEach((m: any) => {
       const key = `${m.corsoCodice}_${m.annoCodice}`;
       if (!corsiToDownload.has(key)) {
           corsiToDownload.set(key, { corsoCodice: m.corsoCodice, annoCodice: m.annoCodice, materie: [] });
       }
       corsiToDownload.get(key).materie.push(m.materiaNome);
    });

    const extraList = Array.from(corsiToDownload.values());
    const extraResults = await Promise.all(
      extraList.map(c => fetchSingleWeek({ dataTarget, corsoCodice: c.corsoCodice, annoCodice: c.annoCodice, isForced }).then(res => ({ res, materieRichieste: c.materie })))
    );
    
    extraResults.forEach(item => {
      if (item.res?.celle) {
         const filteredCells = item.res.celle.filter((cella: any) => {
             const cleanName = cleanHtmlTags(cella.nome_insegnamento);
             return item.materieRichieste.includes(cleanName);
         });
         mergedCells = [...mergedCells, ...filteredCells];
      }
    });

    return { celle: mergedCells, last_day: mainRes?.last_day };
  }, [corsoCodice, annoCodice]);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setInCaricamento(true);
        setErrore(null);

        // Auto-refresh se i dati sono più vecchi di 12 ore
        const lastUpdateTs = localStorage.getItem('ultimoAggiornamentoTimestamp');
        const twelveHoursInMs = 12 * 60 * 60 * 1000;
        const isOldData = lastUpdateTs ? (Date.now() - Number(lastUpdateTs) > twelveHoursInMs) : true;

        const isForced = refreshCount > 0 || isOldData; 
        const dataRiferimento = new Date(); 

        const nextWeekDate = new Date(dataRiferimento);
        nextWeekDate.setDate(nextWeekDate.getDate() + 7);

        const [currentWeekData, nextWeekData] = await Promise.all([
          fetchAllCoursesForDate(dataRiferimento, isForced),
          fetchAllCoursesForDate(nextWeekDate, isForced)
        ]);

        let allCells: any[] = [];
        if (currentWeekData?.celle) allCells = [...allCells, ...currentWeekData.celle];
        if (nextWeekData?.celle) allCells = [...allCells, ...nextWeekData.celle];

        // Integrazione Lezioni Singole Prenotate con filtraggio date
        const lezioniSingole = JSON.parse(localStorage.getItem('lezioniSingolePrenotate') || '[]');
        if (lezioniSingole.length > 0) {
          // Calcoliamo il limite superiore (fine della settimana successiva)
          let fineSettimanaProssima: Date | null = null;
          if (nextWeekData?.last_day) {
            const [g, m, a] = nextWeekData.last_day.split('-');
            fineSettimanaProssima = new Date(Number(a), Number(m) - 1, Number(g), 23, 59, 59);
          }

          const singoleFiltrate = lezioniSingole.filter((l: any) => {
            const [g, m, a] = l.data.split('-');
            const dataLezione = new Date(Number(a), Number(m) - 1, Number(g));
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);

            // Deve essere >= oggi e <= fine della prossima settimana (se disponibile)
            const isDopoOggi = dataLezione >= oggi;
            const isEntroLimite = fineSettimanaProssima ? dataLezione <= fineSettimanaProssima : true;
            
            return isDopoOggi && isEntroLimite;
          });

          allCells = [...allCells, ...singoleFiltrate];
        }

        if (currentWeekData?.last_day) {
            const [gEnd, mEnd, aEnd] = currentWeekData.last_day.split('-');
            setFineSettimanaCorrente(new Date(Number(aEnd), Number(mEnd) - 1, Number(gEnd), 23, 59, 59));
        }

        if (allCells.length > 0) {
          const processedLessons: Lezione[] = allCells
            .filter(isValidLesson)
            .map((lezione: any) => {
              try {
                const [oraInizioStr, oraFineStr] = lezione.orario.split(' - ');
                const [giorno, mese, annoStr] = lezione.data.split('-');
                const [oraInizio, minInizio] = oraInizioStr.split(':');
                const [oraFine, minFine] = oraFineStr.split(':');

                const inizioDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraInizio), Number(minInizio));
                const fineDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraFine), Number(minFine));

                const cleanMail = lezione.mail_docente ? lezione.mail_docente.split(',').map((m: string) => m.trim()).filter(Boolean).join(',') : '';

                const cancelled = isAnnullata(lezione);

                return { ...lezione, inizioDateObj, fineDateObj, mail_docente: cleanMail, isAnnullata: cancelled };
              } catch (e) {
                console.error("Errore nel parsing della lezione:", lezione, e);
                return null;
              }
            })
            .filter((l): l is Lezione => l !== null);

          const uniqueLessons = Array.from(new Map(processedLessons.map(l => [l.id, l])).values());
          uniqueLessons.sort((a, b) => {
             if (!a.inizioDateObj || !b.inizioDateObj) return 0;
             return a.inizioDateObj.getTime() - b.inizioDateObj.getTime();
          });

          setLezioni(uniqueLessons);
        } else {
          setLezioni([]);
        }

        if (isForced || !ultimoAggiornamento) {
          const now = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          localStorage.setItem('ultimoAggiornamento', now);
          localStorage.setItem('ultimoAggiornamentoTimestamp', Date.now().toString());
          setUltimoAggiornamento(now);
        }
      } catch (err) {
        setErrore("Impossibile scaricare i dati. Controlla la connessione.");
      } finally {
        setInCaricamento(false);
      }
    };

    fetchScheduleData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corsoCodice, annoCodice, refreshCount, fetchAllCoursesForDate]);

  return { lezioni, inCaricamento, errore, ultimoAggiornamento, fineSettimanaCorrente, setUltimoAggiornamento };
};
