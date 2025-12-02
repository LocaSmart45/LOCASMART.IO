import React, { useState } from 'react';
import { Users, Plus, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Profile, Property, supabase } from '../../lib/supabase';

interface OwnersManagerProps {
  owners: Profile[];
  properties: Property[];
  onUpdate: () => void;
}

export default function OwnersManager({ owners, properties, onUpdate }: OwnersManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '', // Utilisé uniquement pour le formulaire
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Récupérer l'admin connecté
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("Vous devez être connecté.");

      // 2. RECUPÉRER L'ID DE VOTRE CONCIERGERIE
      // Indispensable car votre table 'profiles' a une colonne 'conciergerie_id' obligatoire
      const { data: adminProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('conciergerie_id')
        .eq('id', adminUser.id)
        .single();

      if (adminProfileError || !adminProfile?.conciergerie_id) {
        console.error("Erreur profil admin:", adminProfileError);
        throw new Error("Impossible de trouver votre conciergerie. Contactez le support.");
      }

      // 3. Créer le compte utilisateur (Authentification)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nom: formData.full_name, // On enregistre le nom dans les métadonnées
            role: 'owner'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 4. Créer le profil dans la base de données
        // ATTENTION : On utilise ici UNIQUEMENT les colonnes qui existent dans votre table SQL
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,              // ID unique
              email: formData.email,             // Email
              nom: formData.full_name,           // CORRECTION : On utilise 'nom', pas 'full_name'
              role: 'owner',                     // Rôle
              managed_by: adminUser.id,          // Lié à vous (l'admin)
              conciergerie_id: adminProfile.conciergerie_id, // Lié à votre agence (OBLIGATOIRE)
              active: true                       // Actif par défaut
            }
          ]);

        if (profileError) throw profileError;

        // Succès !
        setFormData({ email: '', password: '', full_name: '', phone: '' });
        setShowForm(false);
        onUpdate();
      }
    } catch (err: any) {
      console.error("Erreur création:", err);
      // Message d'erreur plus clair pour l'utilisateur
      if (err.message?.includes('conciergerie_id')) {
        setError("Erreur technique : ID de conciergerie manquant.");
      } else {
        setError(err.message || 'Une erreur est survenue lors de la création.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour afficher le nom correctement dans la liste
  // Gère le cas où la colonne s'appelle 'nom' ou 'full_name'
  const getDisplayName = (owner: any) => {
    return owner.nom || owner.full_name || owner.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Propriétaires</h2>
          <p className="text-slate-600 mt-1">{owners.length} propriétaire(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau propriétaire
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Ajouter un propriétaire
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Mehdi EL BERGUI"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="email@exemple.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe provisoire *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-6 rounded-lg transition flex items-center justify-center min-w-[160px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le compte'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setFormData({ email: '', password: '', full_name: '', phone: '' });
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-6 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {owners.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun propriétaire</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Ajoutez votre premier propriétaire pour pouvoir lui assigner des logements.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {owners.map((owner) => {
              const displayName = getDisplayName(owner);
              // Gestion sécurisée de la propriété 'properties' qui peut être absente
              const ownerProperties = (owner as any).properties || [];

              return (
                <div key={owner.id} className="p-6 hover:bg-slate-50 transition group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {displayName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <div className="flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            {owner.email}
                          </div>
                          {/* Affichage du téléphone s'il existe (note: votre table SQL ne semble pas avoir 'phone') */}
                          {(owner as any).phone && (
                            <div className="flex items-center">
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              {(owner as any).phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {ownerProperties.length > 0 ? `${ownerProperties.length} logement(s)` : 'Nouveau'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}