import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- NOUVEAU: Import du fournisseur d'authentification ---
// Le chemin est maintenant exact : './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthContext'; 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* --- NOUVEAU: On enveloppe l'App avec le provider --- */}
    <AuthProvider> 
      <App />
    </AuthProvider>
  </StrictMode>
);