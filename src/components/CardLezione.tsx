import { useState, useEffect } from 'react';

export interface Lezione {
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

interface CardLezioneProps {
  lezione: Lezione;
  isLive?: boolean; 
}

const parseDocenteEmail = (rawName: string) => {
  if (!rawName) return '';
  
  const cleanName = rawName
    .replace(/<[^>]+>/g, '')
    .replace(/Prof\.ssa|Prof\.|Dott\.ssa|Dott\./gi, '')
    .trim()
    .toLowerCase()
    .replace(/[']/g, '')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                 
  const parts = cleanName.split(/\s+/);
  
  if (parts.length >= 2) {
    const firstName = parts.pop();
    if (firstName) parts.unshift(firstName);
  }
  
  return `${parts.join('.')}@unisalento.it`;
};

const getProfessorsData = (rawDocente: string, rawMail: string) => {
  if (!rawDocente) return [];
  
  const names = rawDocente.split(',').map(n => n.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const emails = rawMail ? rawMail.split(',').map(m => m.trim()).filter(Boolean) : [];

  return names.map((nome, index) => ({
    nome,
    email: emails[index] || parseDocenteEmail(nome)
  }));
};

export default function CardLezione({ lezione, isLive = false }: CardLezioneProps) {
  const [profPopup, setProfPopup] = useState<{nome: string, mail: string} | null>(null);
  
  const cleanSubjectName = lezione.nome_insegnamento.replace(/<[^>]+>/g, '').trim();
  const cleanAula = lezione.aula.replace(/<[^>]+>/g, '').trim();

  // Stati per le Smart Notes
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(() => {
    return localStorage.getItem(`nota_${cleanSubjectName}`) || '';
  });

  useEffect(() => {
    if (noteText.trim() === '') {
      localStorage.removeItem(`nota_${cleanSubjectName}`);
    } else {
      localStorage.setItem(`nota_${cleanSubjectName}`, noteText);
    }
  }, [noteText, cleanSubjectName]);

  const professors = getProfessorsData(lezione.docente, lezione.mail_docente || '');

  const isExtra = (() => {
    try {
      const extraSubjects = JSON.parse(localStorage.getItem('materieExtra') || '[]');
      return extraSubjects.some((m: { materiaNome: string }) => m.materiaNome === cleanSubjectName);
    } catch {
      return false;
    }
  })();

  const hasNote = noteText.trim().length > 0;

  return (
    <>
      <div className={`p-5 rounded-2xl shadow-lg flex flex-col relative overflow-hidden border transition-transform hover:scale-[1.02] ${
        isLive 
          ? 'bg-gradient-to-br from-[#2a2215] to-[#1a150c] border-[#c48e12]/30 shadow-xl' 
          : 'bg-[#212121] border-[#333]'
      }`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isLive ? 'bg-[#c48e12]' : 'bg-[#333]'}`}></div>
        
        <div className="relative flex flex-col w-full pb-1">
          <div className="flex justify-between items-start pl-2">
              <h2 className={`font-bold leading-tight pr-14 ${isLive ? 'text-white text-xl' : 'text-white text-lg'}`}>
                {cleanSubjectName}
              </h2>
              
              <button 
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                className={`absolute top-0 right-0 p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                  hasNote 
                    ? 'bg-[#c48e12]/15 border-[#c48e12] text-[#c48e12] shadow-[0_0_12px_rgba(196,142,18,0.25)]' 
                    : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {/* Nuova Icona Taccuino notes-52.svg */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" className="w-5 h-5">
                  <path d="M738.1 166.4H285.9c-66.3 0-120 53.7-120 120v452.2c0 66.3 53.7 120 120 120h452.2c66.3 0 120-53.7 120-120V286.4c0-66.3-53.7-120-120-120zM352.3 80c26.5 0 48 21.5 48 48v86.4c0 26.5-21.5 48-48 48s-48-21.5-48-48V128c0-26.5 21.5-48 48-48zm160 0c26.5 0 48 21.5 48 48v86.4c0 26.5-21.5 48-48 48s-48-21.5-48-48V128c0-26.5 21.5-48 48-48zm160 0c26.5 0 48 21.5 48 48v86.4c0 26.5-21.5 48-48 48s-48-21.5-48-48V128c0-26.5 21.5-48 48-48zM706.1 418.4H317.9c-26.5 0-48-21.5-48-48s21.5-48 48-48h388.2c26.5 0 48 21.5 48 48s-21.5 48-48 48zM608.1 590.4H317.9c-26.5 0-48-21.5-48-48s21.5-48 48-48h290.2c26.5 0 48 21.5 48 48s-21.5 48-48 48z" />
                </svg>
              </button>
          </div>

          <div className={`pl-2 flex flex-col gap-1.5 mt-2 text-sm ${isLive ? 'text-[#e8d5a5]' : 'text-gray-400'}`}>
              <p className="flex items-center gap-2">
                <span className={isLive ? 'opacity-80' : 'opacity-70'}>🕒</span> 
                <span className={`font-medium ${isLive ? 'text-[#c48e12] font-bold' : 'text-gray-200'}`}>{lezione.orario}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className={isLive ? 'opacity-80' : 'opacity-70'}>📍</span> 
                <span className="font-medium">{cleanAula}</span>
              </p>
              <div className="flex items-start gap-2">
                <span className={isLive ? 'opacity-80' : 'opacity-70'}>👨‍🏫</span> 
                <div className="flex flex-wrap gap-x-1 pr-14">
                  {professors.length > 0 ? (
                    professors.map((prof, index) => (
                      <span key={index}>
                        <button 
                          onClick={() => prof.email && setProfPopup({ nome: prof.nome, mail: prof.email })}
                          disabled={!prof.email}
                          className={`font-medium transition-colors text-left ${
                            prof.email 
                              ? 'text-[#c48e12] hover:text-white underline decoration-[#c48e12]/30 hover:decoration-white decoration-2 underline-offset-4' 
                              : (isLive ? 'text-gray-300 cursor-default' : 'text-gray-500 cursor-default')
                          }`}
                        >
                          {prof.nome}
                        </button>
                        {index < professors.length - 1 && <span className={isLive ? 'text-[#e8d5a5]' : 'text-gray-400'}>, </span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Docente non assegnato</span>
                  )}
                </div>
              </div>
          </div>

          {isExtra && (
            <div className="absolute bottom-0 right-0 flex items-center gap-1.5 opacity-50 pointer-events-none select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#c48e12]">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold text-[#c48e12] uppercase tracking-[0.2em] mt-[1px]">A Scelta</span>
            </div>
          )}
        </div>

        {isNoteOpen && (
          <div className="mt-3 pt-4 border-t border-[#333] animate-in fade-in slide-in-from-top-2 duration-200 pl-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[#c48e12] uppercase tracking-widest">Appunti Personali</span>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Aggiungi una nota per questa materia (es. 'Portare PC', 'Cambio di Aula', ecc..)"
              className="w-full bg-[#1a1a1a] text-gray-300 rounded-xl p-3 border border-[#444] text-sm focus:outline-none focus:border-[#c48e12] transition-colors resize-none placeholder-gray-600 shadow-inner"
              rows={3}
            />
          </div>
        )}
      </div>

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
                {profPopup.nome}
              </h3>
              <p className="text-gray-400 text-sm mt-1">Docente Unisalento</p>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#333] mb-6 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                Email Docente
              </span>
              
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[#c48e12] font-medium break-all text-center block">
                  {profPopup.mail}
                </span>
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
    </>
  );
}