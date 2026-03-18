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

  // Creazione di un'icona personalizzata usando l'SVG fornito dall'utente (versione ridotta)
  const customIcon = L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div class="flex items-center justify-center drop-shadow-lg">
        <svg width="32" height="32" viewBox="0 0 512 512" fill="#c48e12" xmlns="http://www.w3.org/2000/svg">
          <g>
            <g>
              <g>
                <path d="M255.991,213.339c35.355,0,64-28.645,64-64s-28.645-64-64-64s-64,28.645-64,64S220.636,213.339,255.991,213.339z
                   M255.991,128.006c11.791,0,21.333,9.542,21.333,21.333s-9.542,21.333-21.333,21.333c-11.791,0-21.333-9.542-21.333-21.333
                  S244.2,128.006,255.991,128.006z"/>
                <path d="M228.229,397.518l8.681,17.362c7.863,15.726,30.305,15.723,38.164-0.004l18.389-36.8
                  c18.466-36.902,35.939-66.021,75.763-128.619l1.036-1.629c5.852-9.199,8.681-13.651,12.042-18.961
                  c14.956-23.623,23.02-50.992,23.02-79.527c0-89.032-77.35-158.521-166.786-148.343c-66.548,7.591-121.188,60.835-130.398,127.125
                  c-5.511,39.683,4.604,78.394,27.526,109.517C166.5,279.435,190.243,321.574,228.229,397.518z M150.402,133.992
                  c6.528-46.989,45.76-85.218,92.967-90.603c64.055-7.29,119.289,42.33,119.289,105.951c0,20.39-5.735,39.855-16.403,56.706
                  c-3.34,5.276-6.155,9.708-11.991,18.88l-1.036,1.629c-40.148,63.109-58.184,93.122-77.28,131.152
                  c-33.196-65.363-56.271-105.169-85.935-145.383C153.636,190.087,146.437,162.538,150.402,133.992z"/>
                <path d="M388.88,313.04c-11.464-2.719-22.961,4.371-25.68,15.835c-2.719,11.464,4.371,22.962,15.835,25.68
                  c57.212,13.567,90.298,35.274,90.298,50.773c0,29.478-94.949,64-213.333,64c-118.398,0-213.333-34.518-213.333-64
                  c0-15.508,33.053-37.209,90.236-50.773c11.464-2.719,18.553-14.217,15.834-25.681c-2.719-11.464-14.217-18.553-25.681-15.833
                  C48.205,330.796,0,362.445,0,405.329c0,64.804,115.134,106.667,256,106.667c140.853,0,256-41.865,256-106.667
                  C512,362.444,463.765,330.798,388.88,313.04z"/>
              </g>
            </g>
          </g>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 28], // Punta del pin proporzionata
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
            maxZoom={19}
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
              detectRetina={true}
              maxZoom={19}
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
