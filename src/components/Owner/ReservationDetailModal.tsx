import { X, Calendar, User, Mail, Phone, MapPin, Euro, CreditCard } from 'lucide-react';
import { Reservation, Property } from '../../lib/supabase';

interface ReservationDetailModalProps {
  reservation: Reservation;
  property: Property;
  onClose: () => void;
}

export default function ReservationDetailModal({
  reservation,
  property,
  onClose,
}: ReservationDetailModalProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-slate-100 text-slate-700',
    };
    const labels = {
      confirmed: 'Confirmée',
      cancelled: 'Annulée',
      completed: 'Terminée',
    };
    return {
      color: colors[status as keyof typeof colors] || colors.confirmed,
      label: labels[status as keyof typeof labels] || status,
    };
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      airbnb: 'bg-rose-100 text-rose-700',
      booking: 'bg-blue-100 text-blue-700',
      direct: 'bg-emerald-100 text-emerald-700',
      manual: 'bg-slate-100 text-slate-700',
    };
    const labels = {
      airbnb: 'Airbnb',
      booking: 'Booking.com',
      direct: 'Réservation directe',
      manual: 'Manuel',
    };
    return {
      color: colors[platform as keyof typeof colors] || colors.manual,
      label: labels[platform as keyof typeof labels] || platform,
    };
  };

  const status = getStatusBadge(reservation.status);
  const platform = getPlatformBadge(reservation.platform);

  const calculateNights = () => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights;
  };

  const nights = calculateNights();
  const netAmount = reservation.total_amount - reservation.commission_amount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Détails de la réservation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${platform.color}`}>
                {platform.label}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center text-slate-700">
              <MapPin className="w-5 h-5 mr-3 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Logement</p>
                <p className="font-semibold">{property.name}</p>
                <p className="text-sm text-slate-600">{property.address}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center text-blue-700 mb-2">
                <Calendar className="w-5 h-5 mr-2" />
                <p className="font-semibold">Arrivée</p>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {new Date(reservation.check_in).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {(reservation as any).check_in_time && (
                <p className="text-sm text-blue-700 mt-1">
                  À partir de {(reservation as any).check_in_time}
                </p>
              )}
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center text-orange-700 mb-2">
                <Calendar className="w-5 h-5 mr-2" />
                <p className="font-semibold">Départ</p>
              </div>
              <p className="text-lg font-bold text-orange-900">
                {new Date(reservation.check_out).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {(reservation as any).check_out_time && (
                <p className="text-sm text-orange-700 mt-1">
                  Avant {(reservation as any).check_out_time}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <p className="text-sm text-slate-600">Durée du séjour</p>
            <p className="text-2xl font-bold text-slate-800">
              {nights} nuit{nights > 1 ? 's' : ''}
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Informations voyageur</h3>
            <div className="space-y-3">
              <div className="flex items-center text-slate-700">
                <User className="w-5 h-5 mr-3 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Nom</p>
                  <p className="font-semibold">{reservation.guest_name}</p>
                </div>
              </div>

              {reservation.guest_email && (
                <div className="flex items-center text-slate-700">
                  <Mail className="w-5 h-5 mr-3 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <a
                      href={`mailto:${reservation.guest_email}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {reservation.guest_email}
                    </a>
                  </div>
                </div>
              )}

              {reservation.guest_phone && (
                <div className="flex items-center text-slate-700">
                  <Phone className="w-5 h-5 mr-3 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Téléphone</p>
                    <a
                      href={`tel:${reservation.guest_phone}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {reservation.guest_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Détails financiers</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                  <Euro className="w-5 h-5 mr-2 text-slate-400" />
                  <span>Montant total</span>
                </div>
                <span className="text-lg font-bold text-slate-800">
                  {reservation.total_amount.toFixed(2)} €
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-700">
                  <CreditCard className="w-5 h-5 mr-2 text-slate-400" />
                  <span>Commission agence</span>
                </div>
                <span className="text-lg font-semibold text-red-600">
                  - {reservation.commission_amount.toFixed(2)} €
                </span>
              </div>

              <div className="border-t border-slate-300 pt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Montant net</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {netAmount.toFixed(2)} €
                </span>
              </div>

              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-sm text-emerald-700">
                  Taux de commission : {property.commission_rate}%
                </p>
              </div>
            </div>
          </div>

          {reservation.notes && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Notes</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-700">{reservation.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
