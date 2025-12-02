import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugPage() {
  const [logs, setLogs] = useState<any>({});
  const [loading, setLoading] = useState(true);

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
        // 2. TEST TABLE PROFILES (Recherche avec ID)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        report.profileTable = {
          status: profile ? "✅ Profil trouvé" : "❌ Profil introuvable",
          data: profile,
          error: profileError,
          // Vérification critique pour votre bug
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
            status: conciergerie ? "✅ Conciergerie existante" : "❌ ID présent mais conciergerie introuvable",
            data: conciergerie,
            error: conciergerieError
          };
        } else {
          report.conciergerieTable = "⚠️ Ignoré car pas d'ID dans le profil";
        }

        // 4. TEST STRUCTURE DES TABLES (Quel nom de colonne ?)
        // On essaie de lire un profil au hasard pour voir les clés
        const { data: sampleProfile } = await supabase.from('profiles').select('*').limit(1);
        if (sampleProfile && sampleProfile.length > 0) {
            report.structureColumns = Object.keys(sampleProfile[0]);
        }
      }

    } catch (err: any) {
      report.crash = err.message;
    }

    setLogs(report);
    setLoading(false);
  }

  // Fonction de réparation automatique (Bouton de secours)
  const fixMyAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous d'abord !");

    // 1. Créer une conciergerie par défaut
    const conciergerieId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    // On essaie d'insérer la conciergerie
    await supabase.from('conciergeries').upsert({
        id: conciergerieId,
        nom: 'Ma Conciergerie Debug',
        email: user.email
    });

    // 2. Mettre à jour mon profil
    const { error } = await supabase
        .from('profiles')
        .update({ conciergerie_id: conciergerieId })
        .eq('id', user.id);

    if (error) alert("Échec réparation : " + error.message);
    else {
        alert("✅ Compte réparé ! Rechargez la page.");
        runDiagnostics();
    }
  };

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-green-400 font-mono">
      <h1 className="text-3xl mb-6 text-white border-b border-gray-700 pb-4">🕵️‍♂️ Console de Débogage LocaSmart</h1>
      
      {loading && <p>Analyse en cours...</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-6">
            
            {/* BOUTON DE RÉPARATION MAGIQUE */}
            <div className="bg-gray-800 p-4 rounded border border-yellow-600">
                <h2 className="text-yellow-500 font-bold text-xl mb-2">🛠️ Zone de Réparation</h2>
                <p className="text-white mb-4">Si vous voyez "❌ NON" pour conciergerie_id ci-dessous, cliquez ici :</p>
                <button 
                    onClick={fixMyAccount}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
                >
                    FORCER LA RÉPARATION DE MON COMPTE
                </button>
            </div>

            {/* RAPPORT AUTH */}
            <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-white font-bold text-xl mb-2">1. Authentification</h2>
                <pre>{JSON.stringify(logs.auth, null, 2)}</pre>
            </div>

            {/* RAPPORT PROFIL */}
            <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-white font-bold text-xl mb-2">2. Table Profiles (Votre Compte)</h2>
                <pre>{JSON.stringify(logs.profileTable, null, 2)}</pre>
            </div>

            {/* STRUCTURE */}
            <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-white font-bold text-xl mb-2">3. Colonnes détectées dans 'profiles'</h2>
                <p>Vérifiez ici si vous voyez "nom" ou "full_name" :</p>
                <pre>{JSON.stringify(logs.structureColumns, null, 2)}</pre>
            </div>
        </div>
      )}
    </div>
  );
}