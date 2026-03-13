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
        
        // CACHE ISTANTANEA
        const cacheKey = `orario_${corsoCodice}_${annoCodice}_${dataStr}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        let datiJSON;

        if (cachedData) {
          datiJSON = JSON.parse(cachedData);
        } else {
          const urlOriginale = 'https://logistica.unisalento.it/PortaleStudenti/grid_call.php';
          const urlAPI = 'https://corsproxy.io/?' + encodeURIComponent(urlOriginale);

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
            return { ...lezione, inizioDateObj, fineDateObj };
          });

          // FILTRO: Solo le lezioni di quel giorno preciso
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
    <div className="min-h-screen bg-gray-50 p-4 pb-28 relative">
      <header className="flex justify-between items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-600">Calendario</h1>
          <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
            Scegli una data
          </p>
        </div>
        <button onClick={resettaImpostazioni} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors text-xl">
          ⚙️
        </button>
      </header>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex justify-center">
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
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2">
          Lezioni del {format(dataSelezionata, "dd MMMM yyyy", { locale: it })}
        </h3>

        {inCaricamento && (
          <div className="text-center p-10 text-gray-500 font-medium animate-pulse">
            ⏳ Ricerca lezioni...
          </div>
        )}

        {errore && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-medium">
            ⚠️ {errore}
          </div>
        )}

        {!inCaricamento && !errore && lezioniGiorno.length === 0 && (
          <div className="text-center p-10 text-gray-500 font-medium bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🏖️</span>
            <p>Nessuna lezione in questa data!</p>
          </div>
        )}

        {!inCaricamento && lezioniGiorno.length > 0 && (
          <div className="grid gap-4">
            {lezioniGiorno.map((lezione, index) => (
              <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-2xl"></div>
                  <div className="flex justify-between items-start pl-2">
                      <h2 className="font-bold text-gray-800 text-lg leading-tight w-3/4">
                      {lezione.nome_insegnamento.replace(/<[^>]+>/g, '')}
                      </h2>
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg shrink-0 text-center">
                      {lezione.orario}
                      </span>
                  </div>
                  <div className="pl-2 flex flex-col gap-1 mt-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                      <span>📍</span> <span className="font-medium">{lezione.aula.replace(/<[^>]+>/g, '')}</span>
                      </p>
                      <p className="flex items-center gap-2">
                      <span>👨‍🏫</span> <span>{lezione.docente.replace(/<[^>]+>/g, '')}</span>
                      </p>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-md mx-auto flex justify-around items-center p-3">
          
          <button onClick={() => navigate('/')} className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Agenda</span>
          </button>

          <button className="flex flex-col items-center p-2 text-blue-600 transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold">Calendario</span>
          </button>

        </div>
      </div>
    </div>
  );
}