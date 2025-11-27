import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Session } from "@supabase/supabase-js";

import Login from "./pages/Login";
import Dashboard from "./components/Admin/AdminDashboard";
import Landing from "./pages/Landing";
import PrestataireTaskPage from "./pages/PrestataireTaskPage";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🚀 IMPORTANT : Désactive la logique de sous-domaine
  const isAppDomain = true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* 🚀 PAGE PRESTATAIRE = PUBLIC */}
        <Route path="/prestataire" element={<PrestataireTaskPage />} />

        {/* ACCUEIL */}
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

        {/* LOGIN */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* DASHBOARD */}
        {session && (
          <Route path="/dashboard/*" element={<Dashboard />} />
        )}

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/prestataire" />} />

      </Routes>
    </Router>
  );
}
