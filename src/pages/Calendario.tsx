import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

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
  mail_docente?: string; 
}

const formattaDataAPI = (data: Date) => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};

export default function Calendario() {
  const navigate = useNavigate();
  const corsoCodice = localStorage.getItem('corsoCodice') || '';
  const annoCodice = localStorage.getItem('annoCodice') || '';

  const [lezioniGiorno, setLezioniGiorno] = useState<Lezione[]>([]);
  const [inCaricamento, setInCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const [dataSelezionata, setDataSelezionata] = useState<Date>(new Date());
  
  const [profPopup, setProfPopup] = useState<{nome: string, mail: string} | null>(null);

  const resettaImpostazioni = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/onboarding');
  };

  useEffect(() => {
    const scaricaOrarioGiorno = async () => {
      try {
        setInCaricamento(true);
        setErrore(null);

        const dataStr = formattaDataAPI(dataSelezionata);
        const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        let datiJSON;

        if (cachedData) {
          datiJSON = JSON.parse(cachedData);
        } else {
          const urlAPI = '/api-unisalento/PortaleStudenti/grid_call.php';

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
          datiJSON = await response.json();
          
          sessionStorage.setItem(cacheKey, JSON.stringify(datiJSON));
        }

        if (datiJSON && datiJSON.celle) {
          const lezioniElaborate: Lezione[] = datiJSON.celle.map((lezione: any) => {
            const [oraInizioStr, oraFineStr] = lezione.orario.split(' - ');
            const [giorno, mese, annoStr] = lezione.data.split('-');
            const [oraInizio, minInizio] = oraInizioStr.split(':');
            const [oraFine, minFine] = oraFineStr.split(':');
            const inizioDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraInizio), Number(minInizio));
            const fineDateObj = new Date(Number(annoStr), Number(mese) - 1, Number(giorno), Number(oraFine), Number(minFine));
            
            // PULIZIA MULTI-MAIL AVANZATA
            const mailPulita = lezione.mail_docente 
              ? lezione.mail_docente.split(',').map((m: string) => m.trim()).filter(Boolean).join(',')
              : '';
            
            return { ...lezione, inizioDateObj, fineDateObj, mail_docente: mailPulita };
          });

          const lezioniDelGiorno = lezioniElaborate.filter(l => l.data === dataStr);

          lezioniDelGiorno.sort((a, b) => {
             if (!a.inizioDateObj || !b.inizioDateObj) return 0;
             return a.inizioDateObj.getTime() - b.inizioDateObj.getTime();
          });

          setLezioniGiorno(lezioniDelGiorno);
        } else {
          setLezioniGiorno([]);
        }
      } catch (err) {
        setErrore("Impossibile caricare l'orario.");
      } finally {
        setInCaricamento(false);
      }
    };

    scaricaOrarioGiorno();
  }, [corsoCodice, annoCodice, dataSelezionata]);

  return (
    <div className="min-h-screen bg-[#121212] p-4 pb-28 relative">
      <header className="flex justify-between items-center mb-6 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div>
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Calendario</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
            Scegli una data
          </p>
        </div>
        <button onClick={resettaImpostazioni} className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl hover:bg-[#2a2a2a] transition-colors text-gray-300 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
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
              <div key={index} className="bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333] flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#333] rounded-l-2xl"></div>
                  <div className="flex justify-between items-start pl-2">
                      <h2 className="font-bold text-white text-lg leading-tight w-3/4">
                      {lezione.nome_insegnamento.replace(/<[^>]+>/g, '')}
                      </h2>
                      <span className="bg-[#1a1a1a] text-[#c48e12] border border-[#333] text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center">
                      {lezione.orario}
                      </span>
                  </div>
                  <div className="pl-2 flex flex-col gap-1.5 mt-2 text-sm text-gray-400">
                      <p className="flex items-center gap-2">
                      <span className="opacity-70">📍</span> <span className="font-medium text-gray-200">{lezione.aula.replace(/<[^>]+>/g, '')}</span>
                      </p>
                      <p className="flex items-center gap-2">
                      <span className="opacity-70">👨‍🏫</span> 
                      {lezione.docente ? (
                        <button 
                          onClick={() => lezione.mail_docente && setProfPopup({ nome: lezione.docente, mail: lezione.mail_docente })}
                          disabled={!lezione.mail_docente}
                          className={`font-medium transition-colors text-left ${lezione.mail_docente ? 'text-[#c48e12] hover:text-white underline decoration-[#c48e12]/30 hover:decoration-white decoration-2 underline-offset-4' : 'text-gray-300 cursor-default'}`}
                        >
                          {lezione.docente.replace(/<[^>]+>/g, '')}
                        </button>
                      ) : (
                        <span className="text-gray-500 italic">Docente non assegnato</span>
                      )}
                    </p>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP PROFESSORE MULTIPLO RISOLTO */}
      {profPopup && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity" 
          onClick={() => setProfPopup(null)}
        >
          <div 
            className="bg-[#212121] border border-[#333] p-6 rounded-3xl shadow-2xl w-full max-w-sm transform transition-all scale-100" 
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="bg-[#1a1a1a] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c48e12]/30 shadow-[0_0_15px_rgba(196,142,18,0.2)]">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-bold text-white leading-tight mb-2">
                {profPopup.nome.replace(/<[^>]+>/g, '')}
              </h3>
              <p className="text-gray-400 text-sm mt-1">Docente Unisalento</p>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#333] mb-6 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email Ufficiale</span>
              
              <div className="flex flex-col gap-1 w-full">
                {profPopup.mail.split(',').map((email, i) => (
                  <span key={i} className="text-[#c48e12] font-medium break-all text-center block">
                    {email}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setProfPopup(null)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-[#1a1a1a] border border-[#333] active:scale-95 transition-all"
              >
                Chiudi
              </button>
              <a 
                href={`mailto:${profPopup.mail}`}
                className="flex-1 py-3 rounded-xl font-black text-[#121212] bg-[#c48e12] active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-[#c48e12]/20"
              >
                <span>Invia Mail</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-xl border-t border-[#333] pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-2 mt-1">
          
          <button onClick={() => navigate('/')} className="flex flex-col items-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">AGENDA</span>
          </button>

          <button className="flex flex-col items-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider">CALENDARIO</span>
          </button>

        </div>
      </div>
    </div>
  );
}