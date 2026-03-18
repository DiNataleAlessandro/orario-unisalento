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

  // Creazione di un'icona personalizzata coerente con il brand (#c48e12)
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-[#c48e12]/30 rounded-full animate-ping"></div>
        <div class="relative w-5 h-5 bg-[#c48e12] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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

        {/* Mappa Interattiva Leaflet */}
        <div className="relative w-full h-64 mb-6 rounded-2xl overflow-hidden border border-[#333] bg-[#1a1a1a] isolate">
          <MapContainer 
            center={[lat, lng]} 
            zoom={16} 
            scrollWheelZoom={false}
            zoomControl={false}
            className="w-full h-full grayscale-[0.2] contrast-[1.1]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon} />
          </MapContainer>
          
          {/* Overlay per i bordi e per impedire click accidentali se non desiderati (opzionale) */}
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
