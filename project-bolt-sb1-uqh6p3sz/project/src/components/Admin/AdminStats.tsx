import { Home, Users, Calendar, Wrench, DollarSign, TrendingUp } from 'lucide-react';
import { Property, Reservation, Intervention, Profile } from '../../lib/supabase';

interface AdminStatsProps {
  properties: Property[];
  reservations: Reservation[];
  interventions: Intervention[];
  owners: Profile[];
}

export default function AdminStats({ properties, reservations, interventions, owners }: AdminStatsProps) {
  const activeProperties = properties.filter(p => p.status === 'active').length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  const pendingInterventions = interventions.filter(i => i.status === 'pending').length;

  const totalRevenue = reservations
    .filter(r => r.status === 'completed' || r.status === 'confirmed')
    .reduce((sum, r) => sum + r.total_amount, 0);

  const totalCommissions = reservations
    .filter(r => r.status === 'completed' || r.status === 'confirmed')
    .reduce((sum, r) => sum + r.commission_amount, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthReservations = reservations.filter(r => {
    const date = new Date(r.check_in);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const upcomingReservations = reservations.filter(r => {
    const checkIn = new Date(r.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkIn >= today && r.status === 'confirmed';
  }).slice(0, 5);

  const todayInterventions = interventions.filter(i => {
    const today = new Date().toISOString().split('T')[0];
    return i.scheduled_date === today && i.status !== 'completed';
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Logements actifs</h3>
          <p className="text-3xl font-bold text-slate-800">{activeProperties}</p>
          <p className="text-xs text-slate-500 mt-1">sur {properties.length} total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Propriétaires</h3>
          <p className="text-3xl font-bold text-slate-800">{owners.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Réservations confirmées</h3>
          <p className="text-3xl font-bold text-slate-800">{confirmedReservations}</p>
          <p className="text-xs text-slate-500 mt-1">{thisMonthReservations.length} ce mois-ci</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Interventions en attente</h3>
          <p className="text-3xl font-bold text-slate-800">{pendingInterventions}</p>
          <p className="text-xs text-slate-500 mt-1">{todayInterventions.length} aujourd'hui</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Finances</h3>
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <p className="text-sm text-slate-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-slate-800">{totalRevenue.toFixed(2)} €</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Commissions perçues</p>
                <p className="text-2xl font-bold text-emerald-600">{totalCommissions.toFixed(2)} €</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {totalRevenue > 0 ? ((totalCommissions / totalRevenue) * 100).toFixed(1) : 0}% moyen
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Interventions aujourd'hui</h3>
          {todayInterventions.length === 0 ? (
            <div className="py-8 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 text-sm">Aucune intervention prévue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayInterventions.map((intervention) => {
                const property = properties.find(p => p.id === intervention.property_id);
                return (
                  <div key={intervention.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800">{intervention.title}</p>
                    <p className="text-sm text-slate-600">{property?.name}</p>
                    {intervention.scheduled_time && (
                      <p className="text-xs text-slate-500 mt-1">
                        {intervention.scheduled_time.slice(0, 5)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Prochaines arrivées</h3>
        {upcomingReservations.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">Aucune arrivée prévue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => {
              const property = properties.find(p => p.id === reservation.property_id);
              return (
                <div key={reservation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{reservation.guest_name}</p>
                    <p className="text-sm text-slate-600">{property?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(reservation.check_in).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(reservation.check_in).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                      })}
                    </p>
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
