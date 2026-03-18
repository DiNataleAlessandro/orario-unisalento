import React from 'react';

interface LocationModalProps {
  name: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

export default function LocationModal({ name, lat, lng, onClose }: LocationModalProps) {
  // Configurazione per la minimappa OpenStreetMap
  const zoom = 0.002;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - zoom},${lat - zoom},${lng + zoom},${lat + zoom}&layer=mapnik&marker=${lat},${lng}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-[#212121] border border-[#333] p-6 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="bg-[#1a1a1a] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#c48e12]/30 shadow-[0_0_15px_rgba(196,142,18,0.2)]">
            <span className="text-2xl">📍</span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight">
            {name}
          </h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Sede Universitaria</p>
        </div>

        {/* Minimappa */}
        <div className="relative w-full aspect-video mb-6 rounded-2xl overflow-hidden border border-[#333] bg-[#1a1a1a]">
          <iframe
            title="Mappa Sede"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={mapSrc}
            className="filter grayscale-[0.3] contrast-[1.1]"
          />
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl"></div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-[#1a1a1a] border border-[#333] active:scale-95 transition-all text-sm"
          >
            Annulla
          </button>
          <a 
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl font-black text-[#121212] bg-[#c48e12] active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-[#c48e12]/20 text-sm"
          >
            Apri su mappe
          </a>
        </div>
      </div>
    </div>
  );
}
