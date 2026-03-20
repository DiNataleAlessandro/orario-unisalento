import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isWithinInterval, isSameDay, setHours, setMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { formatDateForAPI } from '@/utils/date';
import { useNotifications } from '@/hooks/useNotifications';

interface Evento {
  id?: string;
  stato: 'libera' | 'occupata';
  testo: string;
  tipo?: string;
  corso?: string;
  anno?: string;
  timestamp_from: number;
  timestamp_to: number;
  oraInizio?: string;
  oraFine?: string;
  inizioDate?: Date;
  fineDate?: Date;
}

interface Aula {
  id: string;
  nomeAula: string;
  capienza: number;
  eventi: Evento[];
}

const sediEasyroom = [
  { id: "BRI - 4", nome: "Brindisi CR14" }, { id: "URBANO - 5", nome: "Buon Pastore" }, { id: "ET - 19", nome: "Centro Congressi" }, { id: "BRI - 6", nome: "Chiostro S.Paolo Eremita" }, { id: "ET - 4", nome: "Ecotekne IBIL" }, { id: "URBANO - 12", nome: "Ed. Donato Valli" }, { id: "ET - 9", nome: "ET Corpo A" }, { id: "ET - 1", nome: "ET Corpo A6" }, { id: "ET - 10", nome: "ET Corpo B" }, { id: "ET - 11", nome: "ET Corpo D" }, { id: "ET - 12", nome: "ET Corpo E" }, { id: "ET - 13", nome: "ET Corpo H" }, { id: "ET - 14", nome: "ET Corpo I" }, { id: "ET - 15", nome: "ET Corpo M" }, { id: "ET - 7", nome: "ET Corpo O" }, { id: "ET - 16", nome: "ET Corpo R1" }, { id: "ET - 17", nome: "ET Corpo R2" }, { id: "ET - 18", nome: "ET Corpo R3" }, { id: "ET - 5", nome: "ET Corpo Y" }, { id: "ET - 2", nome: "ET Corpo Z" }, { id: "ET - 6", nome: "ET Stecca" }, { id: "ET - 8", nome: "Fiorini" }, { id: "ET - 3", nome: "ISUFI" }, { id: "URBANO - 18", nome: "Liceo De Giorgi" }, { id: "URBANO - 16", nome: "Museo Castromediano" }, { id: "URBANO - 4", nome: "Olivetani" }, { id: "BRI - 1", nome: "Palazzo Nervegna" }, { id: "URBANO - 7", nome: "Principe Umberto" }, { id: "URBANO - 10", nome: "Rettorato (Roasio)" }, { id: "LECCE  - 1", nome: "Infermieristica Lecce" }, { id: "TRICASE - 1", nome: "Infermieristica Tricase" }, { id: "URBANO - 2", nome: "Sperimentale 1" }, { id: "URBANO - 8", nome: "Studium 2000" }, { id: "URBANO - 15", nome: "Studium 5" }, { id: "URBANO - 11", nome: "Studium 6" }, { id: "URBANO - 6", nome: "V.Birago" }, { id: "URBANO - 9", nome: "Via Birago 35" }, { id: "URBANO - 3", nome: "Via Brenta (Adisu)" }
].sort((a, b) => a.nome.localeCompare(b.nome));

export default function Aule() {
  const navigate = useNavigate();
  
  const [area, setArea] = useState(() => localStorage.getItem('ultimaSedeId') || '');
  const [nomeSede, setNomeSede] = useState(() => localStorage.getItem('ultimaSedeCercata') || '');
  const [ricerca, setRicerca] = useState(nomeSede);
  const [tendinaAperta, setTendinaAperta] = useState(false);
  const tendinaRef = useRef<HTMLDivElement>(null);

  const [dataSelezionata, setDataSelezionata] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aule, setAule] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAula, setExpandedAula] = useState<string | null>(null);
  const [oraAttuale, setOraAttuale] = useState(new Date());
  const [showLegend, setShowLegend] = useState(false);

  const legendItems = [
    { tipo: 'Lezione', colore: '#c48e12', desc: 'Lezioni curriculari dei corsi di studio.' },
    { tipo: 'Esame', colore: '#ef4444', desc: 'Appelli d\'esame, parziali o prove scritte.' },
    { tipo: 'Seminario', colore: '#3b82f6', desc: 'Convegni, seminari o recuperi lezioni.' },
    { tipo: 'Manutenzione', colore: '#6b7280', desc: 'Aula non disponibile o in manutenzione.' },
    { tipo: 'Altro', colore: '#a855f7', desc: 'Riunioni, incontri o eventi generici.' }
  ];

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (tendinaRef.current && !tendinaRef.current.contains(e.target as Node)) setTendinaAperta(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setOraAttuale(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const riempiGaps = (eventi: Evento[], date: Date): Evento[] => {
    const startOfDay = setMinutes(setHours(date, 8), 30);
    const endOfDay = setHours(date, 20);
    
    const occupati = [...eventi].sort((a, b) => (a.inizioDate?.getTime() || 0) - (b.inizioDate?.getTime() || 0));
    const risultato: Evento[] = [];
    let current = startOfDay;

    occupati.forEach(ev => {
      if (ev.inizioDate && ev.inizioDate > current) {
        risultato.push({
          stato: 'libera',
          testo: 'AULA LIBERA',
          timestamp_from: Math.floor(current.getTime() / 1000),
          timestamp_to: Math.floor(ev.inizioDate.getTime() / 1000),
          oraInizio: format(current, 'HH:mm'),
          oraFine: format(ev.inizioDate, 'HH:mm'),
          inizioDate: current,
          fineDate: ev.inizioDate
        });
      }
      risultato.push(ev);
      if (ev.fineDate && ev.fineDate > current) current = ev.fineDate;
    });

    if (current < endOfDay) {
      risultato.push({
        stato: 'libera',
        testo: 'AULA LIBERA',
        timestamp_from: Math.floor(current.getTime() / 1000),
        timestamp_to: Math.floor(endOfDay.getTime() / 1000),
        oraInizio: format(current, 'HH:mm'),
        oraFine: format(endOfDay, 'HH:mm'),
        inizioDate: current,
        fineDate: endOfDay
      });
    }

    return risultato;
  };

  const fetchAule = async (idSede: string, date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const dataStr = formatDateForAPI(date);
      const res = await fetch(`/api/easyroom?area=${idSede}&data=${dataStr}`);
      const json = await res.json();
      if (json.success) {
        const auleConOrari = json.data.map((aula: Aula) => {
          const eventiMappati = aula.eventi.map(ev => ({
            ...ev,
            oraInizio: format(new Date(ev.timestamp_from * 1000), 'HH:mm'),
            oraFine: format(new Date(ev.timestamp_to * 1000), 'HH:mm'),
            inizioDate: new Date(ev.timestamp_from * 1000),
            fineDate: new Date(ev.timestamp_to * 1000)
          }));
          return {
            ...aula,
            eventi: riempiGaps(eventiMappati, date)
          };
        });
        setAule(auleConOrari);
      } else {
        setError(json.msg || 'Nessuna informazione disponibile per questa sede.');
        setAule([]);
      }
    } catch (err) {
      setError('Errore di connessione con il server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (area) fetchAule(area, dataSelezionata);
  }, [area, dataSelezionata]);

  const getColoreEvento = (tipo?: string) => {
    const item = legendItems.find(i => i.tipo === tipo) || legendItems.find(i => i.tipo === 'Altro');
    return item?.colore || '#a855f7';
  };

  const getStatoAttuale = (aula: Aula) => {
    if (!isSameDay(dataSelezionata, new Date())) {
      return { tipo: 'altro', msg: '', evento: null, colore: '#333' };
    }
    const ora = oraAttuale;
    const h = ora.getHours();
    const m = ora.getMinutes();
    if (h < 8 || (h === 8 && m < 30) || h >= 20) {
      return { tipo: 'chiuso', msg: 'Sede Chiusa', evento: null, colore: '#333' };
    }
    const eventoInCorso = aula.eventi.find(ev => {
      if (!ev.inizioDate || !ev.fineDate) return false;
      return isWithinInterval(ora, { start: ev.inizioDate, end: ev.fineDate });
    });
    if (!eventoInCorso || eventoInCorso.stato === 'libera') {
      return { tipo: 'libera', msg: 'Libera ora', evento: eventoInCorso || null, colore: '#22c55e' };
    } else {
      const colore = getColoreEvento(eventoInCorso.tipo);
      return { tipo: 'occupata', msg: `Occupata fino alle ${eventoInCorso.oraFine}`, evento: eventoInCorso, colore };
    }
  };

  const { subscription, sendSubscriptionToBackend } = useNotifications();
  const [singolePrenotate, setSingolePrenotate] = useState<string[]>(() => {
    const saved = localStorage.getItem('lezioniSingolePrenotate');
    if (!saved) return [];
    try {
      return JSON.parse(saved).map((l: any) => l.id);
    } catch {
      return [];
    }
  });

  const toggleLezioneSingola = (aula: Aula, ev: Evento) => {
    const lessonId = `lezione-${aula.id}-${ev.timestamp_from}`;
    const saved = localStorage.getItem('lezioniSingolePrenotate');
    let list = saved ? JSON.parse(saved) : [];
    
    const exists = list.find((l: any) => l.id === lessonId);
    
    if (exists) {
      list = list.filter((l: any) => l.id !== lessonId);
    } else {
      const dataStr = format(new Date(ev.timestamp_from * 1000), 'dd-MM-yyyy');
      const orarioStr = `${ev.oraInizio} - ${ev.oraFine}`;
      
      const newLesson = {
        id: lessonId,
        nome_insegnamento: ev.testo,
        docente: 'Docente non specificato',
        orario: orarioStr,
        aula: aula.nomeAula,
        buildingName: nomeSede,
        nome_giorno: format(new Date(ev.timestamp_from * 1000), 'EEEE', { locale: it }),
        data: dataStr,
        isSingleLesson: true,
        buildingId: area,
        timestamp_from: ev.timestamp_from,
        timestamp_to: ev.timestamp_to
      };
      list.push(newLesson);
    }
    
    localStorage.setItem('lezioniSingolePrenotate', JSON.stringify(list));
    setSingolePrenotate(list.map((l: any) => l.id));
    
    if (subscription) {
      sendSubscriptionToBackend(subscription);
    }
  };

  const pulisciRicerca = () => {
    setRicerca('');
    setArea('');
    setNomeSede('');
    setAule([]);
    setTendinaAperta(false);
    localStorage.removeItem('ultimaSedeId');
    localStorage.removeItem('ultimaSedeCercata');
  };

  const selezionaSede = (sede: { id: string, nome: string }) => {
    setArea(sede.id);
    setNomeSede(sede.nome);
    setRicerca(sede.nome);
    setTendinaAperta(false);
    localStorage.setItem('ultimaSedeId', sede.id);
    localStorage.setItem('ultimaSedeCercata', sede.nome);
  };

  const sediFiltrate = useMemo(() => 
    sediEasyroom.filter(s => s.nome.toLowerCase().includes(ricerca.toLowerCase())),
    [ricerca]
  );

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)] relative">
      <header className="flex justify-between items-center mb-4 bg-[#212121] p-5 rounded-2xl shadow-lg border border-[#333]">
        <div className="flex-1 pr-2">
          <h1 className="text-2xl font-black text-[#c48e12] tracking-tight">Disponibilità Aule</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest line-clamp-1">
            Controlla le aule prenotate
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowLegend(true)}
            className="bg-[#1a1a1a] border border-[#333] p-3 rounded-xl transition-colors text-gray-300 hover:bg-[#2a2a2a] active:scale-95 group"
            title="Legenda Tipologie"
          >
            <svg className="w-5 h-5 group-hover:text-[#c48e12] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>
      </header>
      
      <div className="mb-4 space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-[2] space-y-2 relative" ref={tendinaRef}>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Cerca Sede</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Es. Ecotekne..."
                className="w-full bg-[#1a1a1a] border border-[#444] focus:border-[#c48e12] rounded-xl p-4 pr-10 outline-none transition-all font-bold text-white placeholder-gray-600 shadow-inner text-sm"
                value={ricerca}
                onChange={(e) => {
                  setRicerca(e.target.value);
                  setTendinaAperta(true);
                }}
                onClick={() => setTendinaAperta(true)}
              />
              {ricerca && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    pulisciRicerca();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1 bg-[#2a2a2a] rounded-md border border-[#444]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {tendinaAperta && (
              <div className="absolute z-[60] w-full left-0 mt-2 bg-[#2a2a2a] border border-[#444] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <ul className="max-h-60 overflow-y-auto">
                  {sediFiltrate.length > 0 ? (
                    sediFiltrate.map((s) => (
                      <li 
                        key={s.id}
                        onClick={() => selezionaSede(s)}
                        className={`px-5 py-4 hover:bg-[#333] cursor-pointer border-b border-[#333] last:border-none text-sm font-bold flex justify-between items-center transition-colors ${area === s.id ? 'text-[#c48e12] bg-[#c48e12]/5' : 'text-gray-300'}`}
                      >
                        {s.nome}
                        {area === s.id && <span className="w-2 h-2 bg-[#c48e12] rounded-full shadow-[0_0_8px_#c48e12]"></span>}
                      </li>
                    ))
                  ) : (
                    <li className="p-10 text-center text-gray-500 text-xs font-black uppercase tracking-widest">Nessuna sede trovata</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Data</label>
            <button 
              onClick={() => setShowDatePicker(true)}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-xl p-4 h-[54px] outline-none transition-all font-bold text-white shadow-inner text-[10px] uppercase flex items-center justify-between group active:scale-95 whitespace-nowrap overflow-hidden"
            >
              <span className="truncate mr-1">{format(dataSelezionata, 'd MMM yyyy', { locale: it })}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-[#c48e12] group-hover:scale-110 transition-transform shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowDatePicker(false)}>
          <div className="bg-[#212121] border border-[#333] p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 px-2">
               <h3 className="text-sm font-black text-[#c48e12] uppercase tracking-widest">Seleziona Data</h3>
               <button onClick={() => setShowDatePicker(false)} className="text-gray-500 hover:text-white p-2 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            <div className="bg-[#1a1a1a] rounded-2xl p-2 border border-[#333] shadow-inner mb-6 flex justify-center">
              <DayPicker 
                mode="single" 
                selected={dataSelezionata} 
                onSelect={(giorno) => {
                  if (giorno) {
                    setDataSelezionata(giorno);
                    setShowDatePicker(false);
                  }
                }}
                locale={it} 
                showOutsideDays 
                className="font-sans"
              />
            </div>
            <button 
              onClick={() => {
                setDataSelezionata(new Date());
                setShowDatePicker(false);
              }}
              className="w-full bg-[#333] hover:bg-[#444] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              Vai a Oggi
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#c48e12]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#c48e12] border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_#c48e12]"></div>
          </div>
          <p className="text-[#c48e12] font-black uppercase tracking-[0.3em] text-[10px] mt-8 animate-pulse">Analisi Disponibilità...</p>
        </div>
      ) : !area ? (
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-[#212121] rounded-[2.5rem] flex items-center justify-center mb-8 border border-[#333] shadow-xl">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-3">Nessuna Sede</h2>
          <p className="text-sm text-gray-500 font-bold leading-relaxed max-w-[240px]">
            Seleziona un plesso universitario per consultare la disponibilità delle aule.
          </p>
        </div>
      ) : error ? (
        <div className="bg-[#212121] border border-[#333] p-12 rounded-2xl text-center shadow-xl animate-in zoom-in-95 duration-300">
          <div className="text-6xl mb-6 grayscale drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">🏛️</div>
          <p className="text-gray-300 font-bold text-base leading-relaxed mb-8">{error}</p>
          <button onClick={() => fetchAule(area, dataSelezionata)} className="bg-[#c48e12] text-black px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-transform shadow-lg shadow-[#c48e12]/30">
            Riprova Scansione
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          {aule.map((aula) => {
            const stato = getStatoAttuale(aula);
            const isExpanded = expandedAula === aula.id;
            const isLibera = stato.tipo === 'libera';
            const isOccupata = stato.tipo === 'occupata';

            return (
              <div key={aula.id} className={`bg-[#212121] border border-[#333] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 relative ${isExpanded ? 'ring-1 ring-[#c48e12]/30' : 'hover:scale-[1.01]'}`}>
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-300" 
                  style={{ backgroundColor: stato.colore }}
                ></div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      <h2 className="text-xl font-bold text-white tracking-tight leading-tight mb-1">{aula.nomeAula}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                          <span>👥</span> {aula.capienza > 0 ? `${aula.capienza} posti disponibili` : 'Capienza n.d.'}
                        </span>
                      </div>
                    </div>
                    
                    {isSameDay(dataSelezionata, new Date()) && (
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
                        style={{ 
                          backgroundColor: `${stato.colore}15`, 
                          color: stato.colore,
                          borderColor: `${stato.colore}30`
                        }}
                      >
                        <span 
                          className={`w-1.5 h-1.5 rounded-full ${isLibera ? 'animate-pulse' : ''}`}
                          style={{ 
                            backgroundColor: stato.colore,
                            boxShadow: `0 0 8px ${stato.colore}`
                          }}
                        ></span>
                        {stato.msg}
                      </div>
                    )}
                  </div>

                  {isOccupata && stato.evento && (
                    <div className="mb-4 bg-[#1a1a1a] p-4 rounded-xl border border-[#333] shadow-inner">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span 
                          className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                          style={{ color: stato.colore }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: stato.colore }}></span>
                          {stato.evento.tipo || 'In Corso'}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-200 font-bold leading-snug line-clamp-2">{stato.evento.testo}</p>
                      {stato.evento.corso && (
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight leading-relaxed whitespace-pre-wrap">
                          {stato.evento.corso}
                        </p>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => setExpandedAula(isExpanded ? null : aula.id)}
                    className={`w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl border transition-all ${
                      isExpanded ? 'bg-[#c48e12] border-transparent text-black shadow-lg shadow-[#c48e12]/20' : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-gray-200 active:scale-[0.98]'
                    }`}
                  >
                    <span>{isExpanded ? 'Nascondi Orari' : 'Mostra Orari'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-2 bg-[#1a1a1a]/50 pt-4 border-t border-[#333] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 px-1 flex items-center gap-2">
                       <span>Cronologia Eventi</span>
                       <div className="flex-1 h-px bg-gray-800"></div>
                    </div>
                    {aula.eventi.map((ev, idx) => {
                      const evColor = ev.stato === 'libera' ? '#22c55e' : getColoreEvento(ev.tipo);
                      return (
                        <div key={idx} className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                          ev.stato === 'libera' ? 'bg-transparent border-[#222] opacity-40' : 'bg-[#1a1a1a] border-[#333] shadow-sm'
                        }`}>
                          <div className="text-[10px] font-black text-gray-500 w-20 shrink-0 border-r border-[#333] pr-3 flex flex-col items-center pt-1">
                            <span className="text-white text-[11px]">{ev.oraInizio}</span>
                            <span className="opacity-20 my-0.5">|</span>
                            <span>{ev.oraFine}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              {ev.stato === 'occupata' && ev.tipo && (
                                <div 
                                  className="text-[9px] font-black uppercase tracking-widest mb-1"
                                  style={{ color: evColor }}
                                >
                                  {ev.tipo}
                                </div>
                              )}
                              {ev.stato === 'occupata' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLezioneSingola(aula, ev);
                                  }}
                                  className={`shrink-0 p-1 rounded-md border transition-all active:scale-90 ${
                                    singolePrenotate.includes(`lezione-${aula.id}-${ev.timestamp_from}`)
                                      ? 'bg-[#c48e12] border-[#c48e12] text-black shadow-[0_0_8px_rgba(196,142,18,0.3)]'
                                      : 'bg-[#2a2a2a] border-[#444] text-gray-400 hover:text-white'
                                  }`}
                                  title={singolePrenotate.includes(`lezione-${aula.id}-${ev.timestamp_from}`) ? "Rimuovi dall'agenda" : "Aggiungi all'agenda"}
                                >
                                  {singolePrenotate.includes(`lezione-${aula.id}-${ev.timestamp_from}`) ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className={`text-[12px] font-bold leading-snug ${ev.stato === 'libera' ? 'text-green-500/60 italic font-medium' : 'text-gray-200'}`}>
                              {ev.testo}
                            </div>
                            {ev.stato === 'occupata' && ev.corso && (
                              <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tight line-clamp-none whitespace-pre-wrap">
                                {ev.corso}
                              </p>
                            )}                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showLegend && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col p-4 items-center justify-center animate-in fade-in duration-300" onClick={() => setShowLegend(false)}>
          <div className="bg-[#212121] border border-[#333] p-8 rounded-[2rem] shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Legenda Eventi</h2>
              <button onClick={() => setShowLegend(false)} className="text-gray-500 hover:text-white p-2 transition-colors bg-[#1a1a1a] rounded-full border border-[#333]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5">
              {legendItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start group">
                  <div 
                    className="w-4 h-4 rounded-full shrink-0 mt-1 shadow-lg" 
                    style={{ backgroundColor: item.colore, boxShadow: `0 0 10px ${item.colore}40` }}
                  ></div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-0.5" style={{ color: item.colore }}>
                      {item.tipo}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowLegend(false)}
              className="w-full mt-8 py-4 rounded-xl font-black text-[#121212] bg-[#c48e12] hover:bg-[#d89e17] active:scale-95 transition-all shadow-lg shadow-[#c48e12]/20 uppercase tracking-widest text-[11px]"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-xl border-t border-[#333] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.7)] z-50">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center p-2 mt-1">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider">LEZIONI</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-2 text-[#c48e12] transition-transform active:scale-95">
            <svg className="w-6 h-6 mb-1 drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 16.5h1.5m3 0H15" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider">AULE</span>
          </button>

          <button onClick={() => navigate('/piano-di-studi')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider">PIANO</span>
          </button>

          <button onClick={() => navigate('/calendario')} className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-300 transition-colors active:scale-95">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.008v.008H15V12zm0 3h.008v.008H15V15zm-3 0h.008v.008H12V15zm0-3h.008v.008H12V12zm-3 0h.008v.008H9V12zm0 3h.008v.008H9V15z" />
            </svg>
            <span className="text-[9px] font-bold tracking-wider">CALENDARIO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
