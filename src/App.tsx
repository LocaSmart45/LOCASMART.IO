import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- IMPORTS ---
import Landing from './pages/Landing';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';

// Les pages de ton application (Indispensables !)
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
        {/* 1. LA VITRINE (Si pas connecté -> Landing, Si connecté -> Dashboard) */}
        <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Landing />} />
        
        {/* 2. LA PAGE DE CONNEXION */}
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Auth />} />

        {/* 3. L'APPLICATION (Protégée) */}
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