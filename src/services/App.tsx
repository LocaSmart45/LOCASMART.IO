import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

import Login from "../pages/Login";
import Landing from "../pages/Landing";
import Dashboard from "../components/Admin/AdminDashboard";
import PrestataireTaskPage from "../pages/PrestataireTaskPage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // En dev : on force le mode "app"
  const isAppDomain = true;

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
        {/* ⭐ Route publique prestataire */}
        <Route path="/prestataire" element={<PrestataireTaskPage />} />

        {/* Accueil : login si app, landing sinon */}
        <Route
          path="/"
          element={
            isAppDomain
              ? session
                ? <Navigate to="/dashboard" />
                : <Login />
              : <Landing />
          }
        />

        {/* Login direct */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* Dashboard protégé */}
        {session && (
          <Route path="/dashboard/*" element={<Dashboard />} />
        )}

        {/* Fallback : on renvoie vers /prestataire pour tester plus vite */}
        <Route path="*" element={<Navigate to="/prestataire" />} />
      </Routes>
    </Router>
  );
}
