import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// PAGES PUBLIQUES ET WRAPPERS
import Landing from './pages/Landing';
import Login from './pages/Login';
import Layout from './components/Shared/Layout';

// PAGES (Les Wrappers/Placeholders)
import PropertiesPage from './pages/PropertiesPage';
import OwnersPage from './pages/OwnersPage';
import CalendarPage from './pages/CalendarPage'; 
import InterventionsPage from './pages/InterventionsPage'; 
// (Ajoutez ici les imports des autres pages si elles existent : MessagesPage, etc.)

// COMPOSANTS ADMIN (Les Modules Finaux)
import Dashboard from './components/Admin/AdminDashboard';
import FinancialDashboard from './components/Admin/FinancialDashboard'; // FIX FINANCE
import InvoicesManager from './components/Admin/InvoicesManager'; // FIX FACTURATION

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (Auth logic for session remains the same) ...
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
        {/* Route d'accueil */}
        <Route path="/" element={ isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing /> } />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* L'APPLICATION PROTÉGÉE : TOUTES LES ROUTES SONT ICI */}
        {session && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/owners" element={<OwnersPage />} />
            
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            
            {/* ROUTES FINANCE ET FACTURATION (Celles que tu voulais) */}
            <Route path="/finances" element={<FinancialDashboard />} /> 
            <Route path="/invoices" element={<InvoicesManager />} /> 
            
            {/* Si d'autres routes sont nécessaires (synchronisation, abonnement), ajoute-les ici */}
            
            <Route path="/synchronisation" element={<div>Synchronisation Bientôt</div>} />
            <Route path="/abonnement" element={<div>Gestion Abonnements Bientôt</div>} />

            {/* Si on va nulle part, on retourne au Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} /> 
          </Route>
        )}

        {/* Fallback vers la Vitrine */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;