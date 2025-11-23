import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- PAGES PUBLIQUES ET WRAPPERS ---
import Landing from './pages/Landing';
import Login from './pages/Login';
import Layout from './components/Shared/Layout'; // Layout est dans Shared/

// --- PAGES DE L'APPLICATION (Les Wrappers / Placeholders) ---
import PropertiesPage from './pages/PropertiesPage';
import OwnersPage from './pages/OwnersPage';
import CalendarPage from './pages/CalendarPage'; // NOUVEAU
import InterventionsPage from './pages/InterventionsPage'; // NOUVEAU

// --- COMPOSANTS ADMIN (Les modules complets) ---
import Dashboard from './components/Admin/AdminDashboard'; // Corrigé du bug précédent
import FinancialDashboard from './components/Admin/FinancialDashboard'; // Module Finances
import InvoicesManager from './components/Admin/InvoicesManager'; // Module Facturation
// ... Tu pourrais ajouter ici les autres managers si besoin : SyncLogsManager, etc.

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Route d'accueil : Vitrine ou App */}
        <Route path="/" element={ isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing /> } />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* L'APPLICATION PROTÉGÉE */}
        {session && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/owners" element={<OwnersPage />} />
            
            {/* LES PAGES QUE TU VOULAIS RESTAURER : */}
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            <Route path="/finances" element={<FinancialDashboard />} /> 
            <Route path="/invoices" element={<InvoicesManager />} /> 

            {/* Pour éviter les 404 sur les anciennes pages Settings : */}
            <Route path="/billing-settings" element={<div>Paramètres facturation (Bientôt)</div>} />
            <Route path="/subscription" element={<div>Abonnement (Bientôt)</div>} />
          </Route>
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;