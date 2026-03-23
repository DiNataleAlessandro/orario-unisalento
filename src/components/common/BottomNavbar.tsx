import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';

interface BottomNavbarProps {
  activeTab: 'lezioni' | 'aule' | 'piano' | 'calendario';
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const isKeyboardVisible = useKeyboardVisible();

  if (isKeyboardVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-xl border-t border-[#333] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.7)] z-50">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center p-2 mt-1">
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${activeTab === 'lezioni' ? 'text-[#c48e12]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <svg className={`w-6 h-6 mb-1 ${activeTab === 'lezioni' ? 'drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider">LEZIONI</span>
        </button>
        
        <button 
          onClick={() => navigate('/aule')}
          className={`flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${activeTab === 'aule' ? 'text-[#c48e12]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <svg className={`w-6 h-6 mb-1 ${activeTab === 'aule' ? 'drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 16.5h1.5m3 0H15" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider">AULE</span>
        </button>

        <button 
          onClick={() => navigate('/piano-di-studi')}
          className={`flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${activeTab === 'piano' ? 'text-[#c48e12]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <svg className={`w-6 h-6 mb-1 ${activeTab === 'piano' ? 'drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider">PIANO</span>
        </button>

        <button 
          onClick={() => navigate('/calendario')}
          className={`flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${activeTab === 'calendario' ? 'text-[#c48e12]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <svg className={`w-6 h-6 mb-1 ${activeTab === 'calendario' ? 'drop-shadow-[0_0_8px_rgba(196,142,18,0.4)]' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.008v.008H15V12zm0 3h.008v.008H15V15zm-3 0h.008v.008H12V15zm0-3h.008v.008H12V12zm-3 0h.008v.008H9V12zm0 3h.008v.008H9V15z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wider">CALENDARIO</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavbar;
