import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugPage() {
  const [logs, setLogs] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [fixLoading, setFixLoading] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    const report: any = {};
    setLoading(true);

    try {
      // 1. TEST AUTHENTIFICATION
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      report.auth = {
        status: user ? "✅ Connecté" : "❌ Non connecté",
        userId: user?.id,
        email: user?.email,
        error: authError
      };

      if (user) {
        // 2. TEST TABLE PROFILES
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        report.profileTable = {
          status: profile ? "✅ Profil trouvé" : "❌ Profil introuvable dans la table",
          data: profile,
          error: profileError,
          // C'est ici le cœur du problème :
          hasConciergerieId: profile?.conciergerie_id ? "✅ OUI" : "❌ NON (C'est la cause du bug !)",
          role: profile?.role
        };

        // 3. TEST TABLE CONCIERGERIES
        if (profile?.conciergerie_id) {
          const { data: conciergerie, error: conciergerieError } = await supabase
            .from('conciergeries')
            .select('*')
            .eq('id', profile.conciergerie_id)
            .maybeSingle();
            
          report.conciergerieTable = {
            status: conciergerie ? "✅ Conciergerie existante" : "❌ ID présent mais conciergerie introuvable en base",
            data: conciergerie,
            error: conciergerieError
          };
        } else {
          report.conciergerieTable = "⚠️ Test ignoré car pas d'ID dans le profil";
        }
      }

    } catch (err: any) {
      report.crash = err.message;
    }

    setLogs(report);
    setLoading(false);
  }

  // Fonction de réparation automatique
  const fixMyAccount = async () => {
    setFixLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Connectez-vous d'abord !");

      // ID fixe pour votre conciergerie principale
      const conciergerieId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      
      // 1. Créer la conciergerie si elle n'existe pas
      // Note: on utilise 'nom' car c'est votre colonne SQL
      const { error: conciergerieError } = await supabase.from('conciergeries').upsert({
          id: conciergerieId,
          nom: 'Ma Conciergerie Principale', 
          email: user.email
      }, { onConflict: 'id' });

      if (conciergerieError) throw new Error("Erreur création conciergerie: " + conciergerieError.message);

      // 2. Mettre à jour votre profil
      const { error: profileError } = await supabase
          .from('profiles')
          .update({ conciergerie_id: conciergerieId })
          .eq('id', user.id);

      if (profileError) throw new Error("Erreur mise à jour profil: " + profileError.message);

      alert("✅ Compte réparé avec succès !");
      runDiagnostics(); // Relancer le scan

    } catch (err: any) {
      alert("Échec de la réparation : " + err.message);
    } finally {
      setFixLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-green-400 font-mono text-sm overflow-auto">
      <h1 className="text-2xl mb-6 text-white border-b border-gray-700 pb-4">🕵️‍♂️ Console de Débogage LocaSmart</h1>
      
      {loading && <p className="animate-pulse">Analyse du système en cours...</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
            
            {/* BOUTON DE RÉPARATION */}
            {logs.profileTable?.hasConciergerieId?.includes("NON") && (
              <div className="bg-red-900/20 p-6 rounded border border-red-500 animate-pulse">
                  <h2 className="text-red-500 font-bold text-xl mb-2">⚠️ PROBLÈME DÉTECTÉ</h2>
                  <p className="text-white mb-4">Votre compte Admin n'est lié à aucune conciergerie. C'est pour cela que vous ne pouvez pas créer de propriétaires.</p>
                  <button 
                      onClick={fixMyAccount}
                      disabled={fixLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors w-full md:w-auto"
                  >
                      {fixLoading ? "Réparation en cours..." : "🛠️ CLIQUER ICI POUR RÉPARER MON COMPTE"}
                  </button>
              </div>
            )}

            {/* RAPPORT AUTH */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h2 className="text-white font-bold text-lg mb-2">1. Authentification</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify(logs.auth, null, 2)}</pre>
            </div>

            {/* RAPPORT PROFIL */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h2 className="text-white font-bold text-lg mb-2">2. État Table 'profiles'</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify(logs.profileTable, null, 2)}</pre>
            </div>

            {/* RAPPORT CONCIERGERIE */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <h2 className="text-white font-bold text-lg mb-2">3. État Table 'conciergeries'</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify(logs.conciergerieTable, null, 2)}</pre>
            </div>
        </div>
      )}
    </div>
  );
}