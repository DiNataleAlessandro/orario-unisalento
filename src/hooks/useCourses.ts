import { useState, useEffect } from 'react';

export interface Anno {
  label: string;
  valore: string;
  codiceCorsoReale: string;
}

export interface Corso {
  label: string;
  tipo: string;
  valore: string;
  elenco_anni: any[];
}

export interface CorsoUnificato {
  etichetta: string;
  tutti_gli_anni: Anno[];
}

export const useCourses = () => {
  const [corsi, setCorsi] = useState<CorsoUnificato[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setInCaricamento(true);
        const response = await fetch('/data/courses.json');
        if (!response.ok) throw new Error('Errore nel caricamento dei corsi');
        const rawData: Corso[] = await response.json();

        const corsiUnificati = new Map<string, CorsoUnificato>();

        rawData.forEach((item) => {
          const chiave = `${item.label} (${item.tipo})`;
          
          if (!corsiUnificati.has(chiave)) {
            corsiUnificati.set(chiave, {
              etichetta: chiave,
              tutti_gli_anni: []
            });
          } 
          
          const corsoEsistente = corsiUnificati.get(chiave)!;
          
          (item.elenco_anni || []).forEach((annoNuovo: any) => {
            const annoEsistente = corsoEsistente.tutti_gli_anni.find(a => a.label === annoNuovo.label);
            
            if (!annoEsistente) {
              corsoEsistente.tutti_gli_anni.push({
                label: annoNuovo.label,
                valore: annoNuovo.valore,
                codiceCorsoReale: item.valore 
              });
            }
          });
        });

        const mappati = Array.from(corsiUnificati.values());
        mappati.sort((a, b) => a.etichetta.localeCompare(b.etichetta));
        
        setCorsi(mappati);
      } catch (err) {
        setErrore(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setInCaricamento(false);
      }
    };

    loadCourses();
  }, []);

  return { corsi, inCaricamento, errore };
};
