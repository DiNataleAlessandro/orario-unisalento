import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Calendario from './pages/Calendario';
import PianoDiStudi from './pages/PianoDiStudi';

// Ora controlliamo "corsoCodice" invece del vecchio nome
const ProteggiRotta = ({ children }: { children: React.ReactNode }) => {
  const setupCompletato = localStorage.getItem('corsoCodice') !== null;
  return setupCompletato ? children : <Navigate to="/onboarding" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        
        <Route 
          path="/" 
          element={<ProteggiRotta><Home /></ProteggiRotta>} 
        />
        <Route 
          path="/calendario" 
          element={<ProteggiRotta><Calendario /></ProteggiRotta>} 
        />
        <Route 
          path="/piano-di-studi" 
          element={<ProteggiRotta><PianoDiStudi /></ProteggiRotta>} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;