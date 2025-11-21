import { useState } from 'react';
import { Users, Plus, Mail, Phone, Home } from 'lucide-react';
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
    full_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        if (existingProfile.role === 'owner') {
          throw new Error('Ce propriétaire existe déjà dans votre base. Vérifiez la liste ci-dessous.');
        } else {
          throw new Error('Cet email est déjà utilisé par un autre utilisateur.');
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('Cet email est déjà enregistré. Si vous ne le voyez pas dans la liste, contactez le support.');
        }
        throw authError;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: 'owner',
          }]);

        if (profileError) throw profileError;

        setFormData({ email: '', password: '', full_name: '', phone: '' });
        setShowForm(false);
        onUpdate();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Propriétaires</h2>
          <p className="text-slate-600 mt-1">{owners.length} propriétaire(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau propriétaire
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ajouter un propriétaire</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                {loading ? 'Création...' : 'Créer le compte'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setFormData({ email: '', password: '', full_name: '', phone: '' });
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {owners.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aucun propriétaire enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {owners.map((owner) => {
              const ownerProperties = properties.filter(p => p.owner_id === owner.id);

              return (
                <div key={owner.id} className="p-6 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        {owner.full_name}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {owner.email}
                        </div>
                        {owner.phone && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {owner.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Propriétaire
                      </span>
                      <p className="text-xs text-slate-500 mt-2">
                        Membre depuis {new Date(owner.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {ownerProperties.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        Logements ({ownerProperties.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ownerProperties.map((property) => (
                          <div key={property.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="font-medium text-slate-800 text-sm">{property.name}</p>
                            <p className="text-xs text-slate-600 mt-1">{property.address}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
