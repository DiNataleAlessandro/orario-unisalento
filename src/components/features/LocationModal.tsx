import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationModalProps {
  name: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

export default function LocationModal({ name, lat, lng, onClose }: LocationModalProps) {
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Creazione di un'icona personalizzata a forma di goccia (Classic Map Pin)
  const customIcon = L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div class="flex items-center justify-center drop-shadow-md">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" 
            fill="#c48e12" 
            stroke="#121212" 
            stroke-width="1"
          />
          <circle cx="12" cy="9" r="3" fill="rgba(255,255,255,0.8)" />
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // Punta della goccia al centro in basso
  });

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
          <div className="bg-[#1a1a1a] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#c48e12]/30 shadow-[0_0_15px_rgba(196,142,18,0.25)]">
            <span className="text-2xl">📍</span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight">
            {name}
          </h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Sede Universitaria</p>
        </div>

        {/* Mappa Statica con Filtri Dark */}
        <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden border border-[#333] bg-[#1a1a1a] isolate">
          {/* Stile CSS per applicare il filtro solo ai tile della mappa, mantenendo il Pin colorato */}
          <style>{`
            .dark-map-tiles .leaflet-tile-pane {
              filter: grayscale(1) invert(0.9) hue-rotate(180deg) brightness(1.2) contrast(1.2);
            }
          `}</style>
          
          <MapContainer 
            center={[lat, lng]} 
            zoom={17} 
            // Disabilita tutte le interazioni
            dragging={false}
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={false}
            className="w-full h-full dark-map-tiles"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon} />
          </MapContainer>
          
          {/* Overlay di protezione e bordi */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl z-[1000]"></div>
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
