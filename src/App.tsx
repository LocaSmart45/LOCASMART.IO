import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Session } from "@supabase/supabase-js";

// Pages & Composants
import Login from "./pages/Login";
import Dashboard from "./components/Admin/AdminDashboard";
import PrestataireTaskPage from "./pages/PrestataireTaskPage"; // Assurez-vous que le fichier est bien dans src/pages/

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements (Connexion / Déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

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
        {/* ⭐ Route publique pour les prestataires (Ménage/Maintenance) 
            Accessible sans compte, via un lien avec token
        */}
        <Route path="/prestataire" element={<PrestataireTaskPage />} />

        {/* 🔐 Route Login 
            Si déjà connecté -> Hop, au Dashboard
        */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* 🛡️ Dashboard (Espace Admin) - Protégé 
            Si pas connecté -> Retour au Login
        */}
        <Route
          path="/dashboard/*"
          element={session ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* 🏠 Racine du site */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 🕳️ Fallback (Erreur 404) 
            Si l'URL n'existe pas, on renvoie au Login par sécurité
        */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}