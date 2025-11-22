import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, User, MapPin, X } from 'lucide-react';
import { Reservation, Property, supabase } from '../../lib/supabase';
import { notifyNewReservation, notifyReservationModified, notifyReservationCancelled } from '../../services/notificationService';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Shared/Pagination';

interface ReservationsManagerProps {
  reservations: Reservation[];
  properties: Property[];
  onUpdate: () => void;
}

export default function ReservationsManager({ reservations, properties, onUpdate }: ReservationsManagerProps) {
  const pagination = usePagination(reservations, 20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    property_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    platform: 'airbnb' as 'airbnb' | 'booking' | 'direct',
    total_amount: 0,
    commission_amount: 0,
    status: 'confirmed' as 'confirmed' | 'cancelled' | 'completed',
    notes: '',
  });

  function resetForm() {
    setFormData({
      property_id: '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: '',
      check_out: '',
      platform: 'airbnb',
      total_amount: 0,
      commission_amount: 0,
      status: 'confirmed',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(reservation: Reservation) {
    setFormData({
      property_id: reservation.property_id,
      guest_name: reservation.guest_name,
      guest_email: reservation.guest_email || '',
      guest_phone: reservation.guest_phone || '',
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      platform: reservation.platform,
      total_amount: reservation.total_amount,
      commission_amount: reservation.commission_amount,
      status: reservation.status,
      notes: reservation.notes || '',
    });
    setEditingId(reservation.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const property = properties.find(p => p.id === formData.property_id);
      if (!property) return;

      const commissionRate = property.commission_rate || 0;
      const calculatedCommission = (formData.total_amount * commissionRate) / 100;

      const updatedFormData = {
        ...formData,
        commission_amount: calculatedCommission,
      };

      if (editingId) {
        const { error } = await supabase
          .from('reservations')
          .update({ ...updatedFormData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (!error) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', property.owner_id)
            .single();

          if (ownerData) {
            await notifyReservationModified(
              ownerData.id,
              ownerData.email,
              ownerData.full_name,
              property.name,
              editingId,
              formData.guest_name,
              new Date(formData.check_in).toLocaleDateString('fr-FR'),
              new Date(formData.check_out).toLocaleDateString('fr-FR'),
              formData.total_amount
            );
          }
        }
      } else {
        const { data: newReservation, error } = await supabase
          .from('reservations')
          .insert([updatedFormData])
          .select()
          .single();

        if (!error && newReservation) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', property.owner_id)
            .single();

          if (ownerData) {
            await notifyNewReservation(
              ownerData.id,
              ownerData.email,
              ownerData.full_name,
              property.name,
              newReservation.id,
              formData.guest_name,
              new Date(formData.check_in).toLocaleDateString('fr-FR'),
              new Date(formData.check_out).toLocaleDateString('fr-FR'),
              formData.total_amount,
              formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)
            );
          }
        }
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving reservation:', error);
    }
  }

  async function handleCancel(reservation: Reservation) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', reservation.id);

      if (!error) {
        const property = properties.find(p => p.id === reservation.property_id);
        if (property) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', property.owner_id)
            .single();

          if (ownerData) {
            await notifyReservationCancelled(
              ownerData.id,
              ownerData.email,
              ownerData.full_name,
              property.name,
              reservation.id,
              reservation.guest_name,
              new Date(reservation.check_in).toLocaleDateString('fr-FR'),
              new Date(reservation.check_out).toLocaleDateString('fr-FR'),
              reservation.total_amount
            );
          }
        }

        onUpdate();
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
    }
  }

  useEffect(() => {
    if (formData.property_id && formData.total_amount > 0) {
      const property = properties.find(p => p.id === formData.property_id);
      if (property) {
        const commissionRate = property.commission_rate || 0;
        const calculatedCommission = (formData.total_amount * commissionRate) / 100;
        setFormData(prev => ({ ...prev, commission_amount: calculatedCommission }));
      }
    }
  }, [formData.property_id, formData.total_amount, properties]);

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Logement inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Réservations</h2>
          <p className="text-slate-600 mt-1">{reservations.length} réservation(s) enregistrée(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle réservation
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Modifier la réservation' : 'Ajouter une réservation'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
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
                  Nom du voyageur *
                </label>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email du voyageur
                </label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Téléphone du voyageur
                </label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plateforme *
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="airbnb">Airbnb</option>
                  <option value="booking">Booking</option>
                  <option value="direct">Réservation directe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date d'arrivée *
                </label>
                <input
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de départ *
                </label>
                <input
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Montant total (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Commission (€) - Calculée automatiquement
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commission_amount}
                  readOnly
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 outline-none"
                />
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
                  <option value="confirmed">Confirmée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="completed">Terminée</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
        {reservations.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aucune réservation enregistrée</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {pagination.paginatedItems.map((reservation) => (
              <div key={reservation.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <User className="w-5 h-5 mr-2 text-slate-400" />
                        {reservation.guest_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(reservation)}
                          className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {reservation.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(reservation)}
                            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {getPropertyName(reservation.property_id)}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Confirmée' :
                         reservation.status === 'cancelled' ? 'Annulée' : 'Terminée'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.platform === 'airbnb' ? 'bg-rose-100 text-rose-700' :
                        reservation.platform === 'booking' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {reservation.platform.charAt(0).toUpperCase() + reservation.platform.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-slate-800">{reservation.total_amount.toFixed(2)} €</p>
                    <p className="text-sm text-slate-500">Commission: {reservation.commission_amount.toFixed(2)} €</p>
                  </div>
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
