import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- PAGES EXISTANTES (SÛR À 100%) ---
import Landing from './pages/Landing';
import Login from './pages/Login';
import PropertiesPage from './pages/PropertiesPage'; // On vient de le créer

// --- COMPOSANTS ---
import Dashboard from './components/Admin/AdminDashboard'; // Corrigé étape d'avant
import Layout from './components/Shared/Layout'; // Corrigé étape d'avant

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

  const isAppDomain = window.location.hostname.startsWith('app');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <Router>
      <Routes>
        {/* Vitrine ou Login */}
        <Route path="/" element={ 
           isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing /> 
        } />

        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* App Protégée */}
        {session && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<PropertiesPage />} />
            
            {/* J'ai désactivé les autres pages pour l'instant pour que le Build passe au vert.
                Tu pourras les réactiver une par une quand tu auras créé les fichiers. */}
            <Route path="*" element={<Dashboard />} /> 
          </Route>
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;