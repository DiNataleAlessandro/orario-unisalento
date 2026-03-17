import { useState, useRef, useEffect } from 'react';

interface Option {
  valore: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function Select({ label, options, value, onChange, placeholder, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.valore === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#1a1a1a] border-2 border-transparent text-left flex items-center justify-between rounded-2xl p-4 outline-none transition-all font-bold shadow-inner text-sm
          ${disabled ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-[#2a2a2a] focus:border-[#c48e12]'}
          ${isOpen ? 'border-[#c48e12] bg-[#2a2a2a]' : ''}`}
      >
        <span className={!selectedOption ? 'text-gray-600' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <ul className="absolute z-[60] w-full mt-2 bg-[#2a2a2a] border border-[#444] rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.length > 0 ? (
            options.map((opt, i) => (
              <li 
                key={i} 
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.valore);
                  setIsOpen(false);
                }}
                className={`p-4 border-b border-[#333] last:border-none text-sm font-medium transition-colors
                  ${opt.disabled 
                    ? 'text-gray-600 bg-[#1a1a1a]/50 cursor-not-allowed opacity-70' 
                    : `hover:bg-[#383838] cursor-pointer ${value === opt.valore ? 'text-[#c48e12] bg-[#1a1a1a]' : 'text-gray-300'}`
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span>{opt.label}</span>
                  {opt.disabled && <span className="text-[9px] font-black uppercase tracking-widest text-[#c48e12]/60 ml-2">Corso Base</span>}
                </div>
              </li>
            ))
          ) : (
            <li className="p-4 text-sm text-gray-500 text-center font-medium">Nessuna opzione disponibile</li>
          )}
        </ul>
      )}
    </div>
  );
}
