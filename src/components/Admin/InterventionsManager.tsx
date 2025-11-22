import { useState } from 'react';
import { Wrench, Plus, Edit2, MapPin, CheckCircle2 } from 'lucide-react';
import { Intervention, Property, Reservation, supabase } from '../../lib/supabase';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Shared/Pagination';

interface InterventionsManagerProps {
  interventions: Intervention[];
  properties: Property[];
  reservations: Reservation[];
  onUpdate: () => void;
}

export default function InterventionsManager({ interventions, properties, reservations, onUpdate }: InterventionsManagerProps) {
  const pagination = usePagination(interventions, 20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    property_id: '',
    reservation_id: '',
    type: 'cleaning' as 'cleaning' | 'maintenance' | 'check_in' | 'check_out',
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assigned_to: '',
    cost: 0,
  });

  function resetForm() {
    setFormData({
      property_id: '',
      reservation_id: '',
      type: 'cleaning',
      title: '',
      description: '',
      scheduled_date: '',
      scheduled_time: '',
      status: 'pending',
      assigned_to: '',
      cost: 0,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(intervention: Intervention) {
    setFormData({
      property_id: intervention.property_id,
      reservation_id: intervention.reservation_id || '',
      type: intervention.type,
      title: intervention.title,
      description: intervention.description || '',
      scheduled_date: intervention.scheduled_date,
      scheduled_time: intervention.scheduled_time || '',
      status: intervention.status,
      assigned_to: intervention.assigned_to || '',
      cost: intervention.cost || 0,
    });
    setEditingId(intervention.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        reservation_id: formData.reservation_id || null,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await supabase
          .from('interventions')
          .update(dataToSave)
          .eq('id', editingId);
      } else {
        await supabase.from('interventions').insert([dataToSave]);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving intervention:', error);
    }
  }

  async function markAsCompleted(interventionId: string) {
    try {
      await supabase
        .from('interventions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', interventionId);
      onUpdate();
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  }

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Logement inconnu';
  };

  const getTypeLabel = (type: string) => {
    const types = {
      cleaning: 'Ménage',
      maintenance: 'Maintenance',
      check_in: 'Arrivée',
      check_out: 'Départ',
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return statuses[status as keyof typeof statuses] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Interventions</h2>
          <p className="text-slate-600 mt-1">{interventions.length} intervention(s) enregistrée(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle intervention
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Modifier l\'intervention' : 'Ajouter une intervention'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logement *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Sélectionner un logement</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Réservation associée
                </label>
                <select
                  value={formData.reservation_id}
                  onChange={(e) => setFormData({ ...formData, reservation_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="">Aucune</option>
                  {reservations
                    .filter(r => r.property_id === formData.property_id)
                    .map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>
                        {reservation.guest_name} - {new Date(reservation.check_in).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="cleaning">Ménage</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="check_in">Arrivée</option>
                  <option value="check_out">Départ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Heure
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assigné à
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nom de la personne"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Coût (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {interventions.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aucune intervention enregistrée</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {pagination.paginatedItems.map((intervention) => (
              <div key={intervention.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{intervention.title}</h3>
                      <div className="flex items-center space-x-2">
                        {intervention.status !== 'completed' && intervention.status !== 'cancelled' && (
                          <button
                            onClick={() => markAsCompleted(intervention.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Marquer comme terminée"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(intervention)}
                          className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {getPropertyName(intervention.property_id)}
                    </div>
                    {intervention.description && (
                      <p className="text-sm text-slate-600 mb-3">{intervention.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        intervention.type === 'cleaning' ? 'bg-blue-100 text-blue-700' :
                        intervention.type === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                        intervention.type === 'check_in' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {getTypeLabel(intervention.type)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        intervention.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        intervention.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        intervention.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusLabel(intervention.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR')}
                        {intervention.scheduled_time && ` à ${intervention.scheduled_time.slice(0, 5)}`}
                      </span>
                    </div>
                    {intervention.assigned_to && (
                      <p className="text-sm text-slate-500 mt-2">
                        Assigné à: <span className="font-medium">{intervention.assigned_to}</span>
                      </p>
                    )}
                  </div>
                  {intervention.cost !== null && intervention.cost !== undefined && intervention.cost > 0 && (
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-slate-800">{intervention.cost.toFixed(2)} €</p>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
