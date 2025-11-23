import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// PAGES PUBLIQUES
import Landing from './pages/Landing';
import Login from './pages/Login';

// COMPOSANTS ADMIN (D'après ta capture d'écran)
// C'EST ICI QUE C'ÉTAIT FAUX AVANT :
import Dashboard from './components/Admin/AdminDashboard'; 

// LAYOUT (D'après l'étape 1 qu'on vient de faire)
import Layout from './components/Shared/Layout';

// PAGES (Assure-toi que ces fichiers existent dans src/pages/, sinon commente-les)
import PropertiesPage from './pages/PropertiesPage';
// ... Tu pourras décommenter les autres pages quand tu seras sûr qu'elles existent
// Pour l'instant, concentrons-nous sur le Dashboard pour que le build passe.

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
        {/* Route par défaut (Vitrine ou Login selon le domaine) */}
        <Route path="/" element={ 
           isAppDomain ? (session ? <Navigate to="/dashboard" /> : <Login />) : <Landing /> 
        } />

        {/* Login explicite */}
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />

        {/* Dashboard Protégé */}
        {session && (
          <Route element={<Layout />}>
            {/* Ici on appelle le composant AdminDashboard qu'on a importé sous le nom 'Dashboard' */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* J'ai commenté les autres routes pour l'instant pour garantir que le build passe.
                Décommente-les une par une quand tu es sûr que les fichiers existent dans src/pages */}
            <Route path="/properties" element={<PropertiesPage />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;