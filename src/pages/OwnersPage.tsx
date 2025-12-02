import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Assurez-vous que ce chemin est correct selon votre structure
import { Userqr, Plus, Search, Mail, Phone, Trash2, Loader2, AlertCircle } from 'lucide-react';

// Définition du type pour un Propriétaire
type Owner = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'owner';
  managed_by: string;
};

export default function OwnersManager() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la modale d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Charger les propriétaires au démarrage
  useEffect(() => {
    fetchOwners();
  }, []);

  async function fetchOwners() {
    try {
      setLoading(true);
      // Récupérer l'utilisateur connecté (l'Admin)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Vous devez être connecté.");
      }

      // La requête avec le filtre de sécurité implicite via RLS
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'owner')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOwners(data || []);
    } catch (err: any) {
      console.error('Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour ajouter un propriétaire
  async function handleAddOwner(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Récupérer l'ID de l'Admin connecté (C'EST ICI LA SÉCURITÉ)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Session expirée");

      /* NOTE IMPORTANTE : 
         Dans un système idéal Supabase, on doit d'abord créer l'utilisateur Auth.
         Pour ce code, nous insérons le profil. Si cela échoue à cause de la clé étrangère (FK),
         c'est qu'il faut d'abord inviter l'utilisateur par email via une Edge Function.
         
         Ici, nous tentons l'insertion sécurisée avec 'managed_by'.
      */
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            // On génère un ID temporaire si on ne passe pas par l'Auth système (ou utilisez l'ID retourné par signUp)
            // Pour l'exemple simple, on suppose que vous gérez les invitations autrement.
            // Si vous avez une erreur FK, contactez-moi pour l'étape "Invitation".
            id: crypto.randomUUID(), // Temporaire pour contourner la FK si la table le permet, sinon voir note ci-dessus.
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: 'owner',
            managed_by: user.id // <--- LA LIGNE CRITIQUE : Ce propriétaire VOUS appartient.
          }
        ]);

      if (insertError) throw insertError;

      // Succès : on ferme et on recharge
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', phone: '' });
      fetchOwners();
      
    } catch (err: any) {
      console.error('Erreur ajout:', err);
      setError("Erreur lors de la création : " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes Propriétaires</h1>
          <p className="text-slate-500">Gérez les comptes de vos clients bailleurs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="h-5 w-5" />
          Nouveau Propriétaire
        </button>
      </div>

      {/* Barre de recherche (Visuelle) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Rechercher par nom ou email..." 
          className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Liste des propriétaires */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : owners.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Aucun propriétaire pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {owner.full_name.charAt(0)}
                      </div>
                      {owner.full_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {owner.email}
                        </div>
                        {owner.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {owner.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-red-600 transition-colors p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale d'ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Ajouter un propriétaire</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddOwner} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}