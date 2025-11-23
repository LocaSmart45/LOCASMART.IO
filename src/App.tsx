import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- IMPORTS VITAux (Ajout de Landing) ---
import Login from './pages/Login';
import Dashboard from './components/Admin/AdminDashboard'; 
import Landing from './pages/Landing'; // La Vitrine

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

  // NOUVEAU : Logique de détection du sous-domaine 'app.'
  const isAppDomain = typeof window !== 'undefined' && window.location.hostname.startsWith('app');

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
        {/* 1. ROUTE RACINE (/) : Gère le Pont Vitrine/SaaS */}
        <Route 
          path="/" 
          element={
            // Si l'utilisateur est sur app.locasmart.net : on le met au Login/Dashboard.
            // Si l'utilisateur est sur locasmart.net : on lui montre la Vitrine (Landing Page).
            isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing />
          } 
        />
        
        {/* 2. ROUTE LOGIN (/login) : Pour la navigation interne ou directe sur l'App */}
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* 3. APPLICATION PROTÉGÉE */}
        {session && (
          <Route path="/dashboard/*" element={<Dashboard />} /> 
        )}

        {/* 4. FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;