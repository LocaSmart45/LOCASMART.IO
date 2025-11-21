import { useState } from 'react';
import { Calendar, MapPin, User } from 'lucide-react';
import { Reservation, Property } from '../../lib/supabase';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Shared/Pagination';
import ReservationDetailModal from './ReservationDetailModal';

interface ReservationsListProps {
  reservations: Reservation[];
  properties: Property[];
}

export default function ReservationsList({ reservations, properties }: ReservationsListProps) {
  const pagination = usePagination(reservations, 20);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Logement inconnu';
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      airbnb: 'bg-rose-100 text-rose-700',
      booking: 'bg-blue-100 text-blue-700',
      direct: 'bg-emerald-100 text-emerald-700',
    };
    return colors[platform as keyof typeof colors] || colors.direct;
  };

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Réservations</h2>
        <p className="text-slate-600 mt-1">{reservations.length} réservation(s) au total</p>
        <p className="text-sm text-blue-600 mt-1">ℹ️ Cliquez sur une réservation pour voir les détails</p>
      </div>

      {reservations.length === 0 ? (
        <div className="p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Aucune réservation enregistrée</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            {pagination.paginatedItems.map((reservation) => {
            const status = getStatusBadge(reservation.status);
            return (
              <div
                key={reservation.id}
                className="p-6 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => {
                  setSelectedReservation(reservation);
                  const property = properties.find(p => p.id === reservation.property_id);
                  setSelectedProperty(property || null);
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                        <User className="w-5 h-5 mr-2 text-slate-400" />
                        {reservation.guest_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {getPropertyName(reservation.property_id)}
                    </div>
                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(reservation.check_in).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {' → '}
                      {new Date(reservation.check_out).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPlatformBadge(reservation.platform)}`}>
                      {reservation.platform.charAt(0).toUpperCase() + reservation.platform.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">
                      {reservation.total_amount.toFixed(2)} €
                    </p>
                    <p className="text-sm text-slate-500">
                      Commission: {reservation.commission_amount.toFixed(2)} €
                    </p>
                  </div>
                </div>
                {reservation.notes && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{reservation.notes}</p>
                  </div>
                )}
              </div>
            );
            })}
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.handlePageChange}
          />
        </>
      )}

      {selectedReservation && selectedProperty && (
        <ReservationDetailModal
          reservation={selectedReservation}
          property={selectedProperty}
          onClose={() => {
            setSelectedReservation(null);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
}
