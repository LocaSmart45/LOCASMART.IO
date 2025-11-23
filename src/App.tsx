import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// PAGES
import Landing from './pages/Landing';
import Login from './pages/Login';

// COMPOSANTS (Chemins corrigés d'après ton projet)
import Dashboard from './components/Admin/Dashboard';
import Layout from './components/Shared/Layout';

// PAGES DE L'APP
import PropertiesPage from './pages/PropertiesPage';
import CalendarPage from './pages/CalendarPage';
import OwnersPage from './pages/OwnersPage';
import InterventionsPage from './pages/InterventionsPage';
import FinancesPage from './pages/FinancesPage';
import InvoicesPage from './pages/InvoicesPage';
import SyncPage from './pages/SyncPage';
import BillingSettingsPage from './pages/BillingSettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import MessagesPage from './pages/MessagesPage';

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

  // Détection du sous-domaine "app"
  const isAppDomain = window.location.hostname.startsWith('app');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* LOGIQUE INTELLIGENTE :
           - Si je suis sur "locasmart.net" -> J'affiche la Vitrine (Landing).
           - Si je suis sur "app.locasmart.net" -> J'affiche le Login (ou Dashboard si connecté).
        */}
        <Route path="/" element={ 
           isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing /> 
        } />

        {/* Route Login explicite */}
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* L'APPLICATION (Uniquement si connecté) */}
        {session && (
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/owners" element={<OwnersPage />} />
            <Route path="/interventions" element={<InterventionsPage />} />
            <Route path="/finances" element={<FinancesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/billing-settings" element={<BillingSettingsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/messages" element={<MessagesPage />} />
          </Route>
        )}

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;