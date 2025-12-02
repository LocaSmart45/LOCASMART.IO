import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Plus, MapPin, Search, Home, Loader2, AlertCircle, Trash2 } from 'lucide-react';

// Types pour TypeScript
type Property = {
  id: string;
  name: string;
  address: string;
  owner_id: string;
  status: 'active' | 'inactive';
  // On joint souvent les infos du propriétaire pour l'affichage
  owner?: {
    full_name: string;
  };
};

type Owner = {
  id: string;
  full_name: string;
};

export default function PropertiesManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]); // Pour la liste déroulante
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État de la modale d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner_id: '',
    commission_rate: 20 // Par défaut
  });

  // Au chargement, on récupère les Logements ET les Propriétaires
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // 1. Récupérer les propriétaires (pour pouvoir les assigner)
      // Grâce à votre correctif précédent, vous ne voyez que VOS propriétaires ici
      const { data: ownersData, error: ownersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'owner');
        
      if (ownersError) throw ownersError;
      setOwners(ownersData || []);

      // 2. Récupérer les logements avec le nom du propriétaire associé
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (propsError) throw propsError;
      
      // TypeScript n'aime pas toujours les jointures dynamiques, on force le type ici
      setProperties(propsData as any || []);

    } catch (err: any) {
      console.error('Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formData.owner_id) {
      setError("Vous devez sélectionner un propriétaire.");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .insert([
          {
            name: formData.name,
            address: formData.address,
            owner_id: formData.owner_id, // Le lien de sécurité est ici
            commission_rate: formData.commission_rate,
            status: 'active'
          }
        ]);

      if (error) throw error;

      // Succès
      setIsModalOpen(false);
      setFormData({ name: '', address: '', owner_id: '', commission_rate: 20 });
      fetchData(); // On recharge la liste

    } catch (err: any) {
      console.error('Erreur création:', err);
      setError("Erreur : " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes Logements</h1>
          <p className="text-slate-500">Gérez le parc immobilier de votre conciergerie.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="h-5 w-5" />
          Ajouter un bien
        </button>
      </div>

      {/* Liste des biens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : properties.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            <Home className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Aucun logement pour le moment.</p>
            <p className="text-sm">Commencez par en ajouter un !</p>
          </div>
        ) : (
          properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                {/* Placeholder image si pas de photo */}
                <Building2 className="h-12 w-12 text-slate-300" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-emerald-600 shadow-sm">
                  ACTIF
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{property.name}</h3>
                <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 h-10">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{property.address}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Propriétaire</span>
                    <span className="font-medium text-slate-700">
                      {/* @ts-ignore : owner est injecté par la jointure */}
                      {property.owner?.full_name || 'Inconnu'}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale d'ajout */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Ajouter un logement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddProperty} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              {owners.length === 0 && (
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm mb-4">
                  ⚠️ Attention : Vous devez d'abord créer un Propriétaire avant de pouvoir ajouter un logement.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du logement (Interne)</label>
                <input
                  type="text"
                  placeholder="Ex: Apt Loft Centre"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse complète</label>
                <input
                  type="text"
                  placeholder="10 rue de la Paix, 75000 Paris"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Propriétaire</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.owner_id}
                    onChange={e => setFormData({...formData, owner_id: e.target.value})}
                  >
                    <option value="">-- Choisir --</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.commission_rate}
                    onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})}
                  />
                </div>
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
                  disabled={submitting || owners.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer le bien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}