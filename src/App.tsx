import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- IMPORTS MINIMAUX POUR LE DASHBOARD (Sécurité Max) ---
import Login from './pages/Login';
import Dashboard from './components/Admin/AdminDashboard'; 
import Layout from './components/Shared/Layout'; // Assurez-vous que Layout est bien dans Shared/

// Imports temporairement inutilisés pour éviter les erreurs de compilation
// import Landing from './pages/Landing';
// import PropertiesPage from './pages/PropertiesPage';
// import OwnersPage from './pages/OwnersPage';
// ... et tous les autres modules ...

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

        {/* APPLICATION PROTÉGÉE : SEUL LE DASHBOARD EST ACTIF */}
        {session && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Si l'utilisateur clique sur un lien non défini, il revient au Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}

        {/* Fallback vers la connexion */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;