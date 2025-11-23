import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- IMPORTS MINIMAUX POUR LE MONOLITHE (Plus de Layout) ---
import Login from './pages/Login';
import Dashboard from './components/Admin/AdminDashboard'; // Le composant qui contient TOUTES les tabs
// Imports des autres pages ne sont plus nécessaires ici car Dashboard les gère

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* L'ACCUEIL est la page de connexion par défaut */}
        <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* APPLICATION PROTÉGÉE : TOUT LE SAAS EST DANS LE DASHBOARD */}
        {session && (
          // Le composant Layout/Sidebar est retiré. On utilise le Dashboard comme page entière.
          <Route path="/dashboard/*" element={<Dashboard />} /> 
        )}

        {/* Fallback vers la connexion */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;