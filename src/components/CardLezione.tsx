import { useState } from 'react';

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

// Genera la mail per UN SINGOLO professore
const generaEmailSingola = (nomeProf: string) => {
  if (!nomeProf) return '';
  let pulito = nomeProf.replace(/<[^>]+>/g, '')
                       .replace(/Prof\.ssa|Prof\.|Dott\.ssa|Dott\./gi, '')
                       .trim()
                       .toLowerCase();
                       
  // Rimuoviamo accenti e apostrofi
  pulito = pulito.replace(/[']/g, '')
                 .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
                 
  const parti = pulito.split(/\s+/);
  
  // Il formato UniSalento è "Cognome Nome". 
  // Prendiamo l'ultima parola (Nome) e la portiamo all'inizio.
  if (parti.length >= 2) {
    const nome = parti.pop();
    if (nome) parti.unshift(nome);
  }
  
  return `${parti.join('.')}@unisalento.it`;
};

// Accoppia ogni professore alla sua mail (ufficiale o generata)
const ottieniListaProfessori = (docenteGrezzo: string, mailGrezza: string) => {
  if (!docenteGrezzo) return [];
  
  // Dividiamo i nomi e le mail usando la virgola
  const nomi = docenteGrezzo.split(',').map(n => n.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  const mails = mailGrezza ? mailGrezza.split(',').map(m => m.trim()).filter(Boolean) : [];

  return nomi.map((nome, index) => {
    const emailUfficiale = mails[index] || '';
    const emailFinale = emailUfficiale || generaEmailSingola(nome);
    return { nome, email: emailFinale };
  });
};

export default function CardLezione({ lezione, isLive = false }: CardLezioneProps) {
  const [profPopup, setProfPopup] = useState<{nome: string, mail: string} | null>(null);

  const listaProfessori = ottieniListaProfessori(lezione.docente, lezione.mail_docente || '');

  return (
    <>
      <div className={`p-5 rounded-2xl shadow-lg flex flex-col gap-2 relative overflow-hidden border transition-transform hover:scale-[1.02] ${
        isLive 
          ? 'bg-gradient-to-br from-[#2a2215] to-[#1a150c] border-[#c48e12]/30 shadow-xl' 
          : 'bg-[#212121] border-[#333]'
      }`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isLive ? 'bg-[#c48e12]' : 'bg-[#333]'}`}></div>
        
        <div className="flex justify-between items-start pl-2">
            <h2 className={`font-bold leading-tight ${isLive ? 'text-white text-xl' : 'text-white text-lg'}`}>
              {lezione.nome_insegnamento.replace(/<[^>]+>/g, '')}
            </h2>
        </div>

        <div className={`pl-2 flex flex-col gap-1.5 mt-2 text-sm ${isLive ? 'text-[#e8d5a5]' : 'text-gray-400'}`}>
            <p className="flex items-center gap-2">
              <span className={isLive ? 'opacity-80' : 'opacity-70'}>🕒</span> 
              <span className={`font-medium ${isLive ? 'text-[#c48e12] font-bold' : 'text-gray-200'}`}>{lezione.orario}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className={isLive ? 'opacity-80' : 'opacity-70'}>📍</span> 
              <span className="font-medium">{lezione.aula.replace(/<[^>]+>/g, '')}</span>
            </p>
            <div className="flex items-start gap-2">
              <span className={isLive ? 'opacity-80' : 'opacity-70'}>👨‍🏫</span> 
              <div className="flex flex-wrap gap-x-1">
                {listaProfessori.length > 0 ? (
                  listaProfessori.map((prof, index) => (
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
                      {/* Aggiungiamo la virgola se non è l'ultimo professore */}
                      {index < listaProfessori.length - 1 && <span className={isLive ? 'text-[#e8d5a5]' : 'text-gray-400'}>, </span>}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">Docente non assegnato</span>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* POPUP PROFESSORE MINIMAL */}
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