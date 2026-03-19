import { VercelRequest, VercelResponse } from '@vercel node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, data: 'Metodo non consentito. Usa GET.' });
  }

  const { area = 'ET - 5', data = '' } = req.query; 
  const apiUrl = 'https://logistica.unisalento.it/PortaleStudenti/rooms_call.php';

  try {
    const params = new URLSearchParams();
    params.append('form-type', 'rooms');
    params.append('view', 'rooms');
    params.append('include', 'rooms');
    params.append('sede[]', area as string);
    params.append('aula[]', 'all');
    params.append('date', data as string);
    params.append('_lang', 'it');
    params.append('all_events', '0');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: params.toString(),
    });

    if (!response.ok) throw new Error(`API call failed: ${response.statusText}`);

    const json = await response.json();
    
    const areaKey = (area as string).trim();
    let roomsSource = [];

    const getArrayFrom = (data: any) => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === 'object') return Object.values(data);
      return [];
    };

    if (json.area_rooms && json.area_rooms[areaKey]) {
      roomsSource = getArrayFrom(json.area_rooms[areaKey]);
    } 
    
    if (roomsSource.length === 0 && json.rooms) {
      const allRooms = getArrayFrom(json.rooms);
      roomsSource = allRooms.filter((r: any) => 
        String(r.area_code || r.area_name || '').trim().toLowerCase() === areaKey.toLowerCase()
      );
      if (roomsSource.length === 0) roomsSource = allRooms;
    }

    if (roomsSource.length === 0) {
       return res.status(200).json({ success: false, msg: "Nessun dato aule trovato per questa sede." });
    }
    
    const auleMappate = roomsSource.map((room: any) => {
      const idAula = room.id || room.id_aula || room.CodiceAula || room.room_id || room.room_code;
      
      const eventiAula = (json.events || [])
        .filter((ev: any) => String(ev.id_aula) === String(idAula) || String(ev.CodiceAula) === String(idAula) || String(ev.room_id) === String(idAula))
        .map((ev: any) => {
          let corso = '';
          let anno = '';

          // Estrazione di tutti i percorsi didattici associati (da insegnamenti o percorsi_didattici)
          const allPd: any[] = [];
          if (ev.insegnamenti && Array.isArray(ev.insegnamenti)) {
            ev.insegnamenti.forEach((ins: any) => {
              if (ins.cds && typeof ins.cds === 'object') {
                Object.values(ins.cds).forEach(v => allPd.push(v));
              }
            });
          }
          if (ev.percorsi_didattici && typeof ev.percorsi_didattici === 'object' && !Array.isArray(ev.percorsi_didattici)) {
            Object.values(ev.percorsi_didattici).forEach(v => allPd.push(v));
          }

          if (allPd.length > 0) {
            // Raggruppiamo per LaureaCodice per non ripetere il nome del corso
            const gruppi: Record<string, { nome: string, code: string, anno: string, curricula: string[] }> = {};
            
            allPd.forEach(pd => {
              const key = pd.LaureaCodice || pd.LaureaNome || 'nd';
              if (!gruppi[key]) {
                gruppi[key] = {
                  nome: pd.LaureaNome || pd.nome_cds || '',
                  code: pd.LaureaCodice || pd.codice_cds || '',
                  anno: pd.AnnoCorso || pd.anno || '',
                  curricula: []
                };
              }
              if (pd.CurriculumNome) gruppi[key].curricula.push(pd.CurriculumNome);
            });

            const percorsiMappati = Object.values(gruppi).map(g => {
              const nomeCorso = g.code ? `${g.nome} [${g.code}]` : g.nome;
              const uniqueCurrs = Array.from(new Set(g.curricula));
              const annoStr = g.anno ? (g.anno.includes('-') ? g.anno : `${g.anno}° Anno`) : '';
              
              if (uniqueCurrs.length > 0) {
                const currLines = uniqueCurrs.map(c => `  • ${c}`).join('\n');
                return `${nomeCorso} - ${annoStr}\n${currLines}`;
              }
              
              return `${nomeCorso} - ${annoStr}`;
            });

            // Uniamo i diversi corsi con un doppio a capo per separarli nettamente
            corso = percorsiMappati.join('\n\n');
            anno = ''; 
          }

          return {
            testo: ev.name || ev.nome || 'Evento senza nome',
            tipo: ev.tipo || ev.type || 'Evento',
            corso: corso,
            anno: anno,
            timestamp_from: ev.timestamp_from,
            timestamp_to: ev.timestamp_to,
            stato: 'occupata'
          };
        });

      return {
        id: String(idAula),
        nomeAula: room.room_name || room.name || room.room_code || 'Aula senza nome',
        capienza: parseInt(room.capacity || room.capienza || room.posti, 10) || 0,
        eventi: eventiAula
      };
    });

    return res.status(200).json({ success: true, data: auleMappate });

  } catch (error: any) {
    console.error('[EASYROOM] API error:', error);
    return res.status(500).json({ success: false, data: error.message });
  }
}
