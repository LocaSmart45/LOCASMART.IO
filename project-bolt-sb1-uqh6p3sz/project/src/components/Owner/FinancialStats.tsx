import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { Reservation, Property } from '../../lib/supabase';

interface FinancialStatsProps {
  reservations: Reservation[];
  properties: Property[];
}

export default function FinancialStats({ reservations, properties }: FinancialStatsProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const completedReservations = reservations.filter(r => r.status === 'completed');

  const totalRevenue = completedReservations.reduce((sum, r) => sum + r.total_amount, 0);
  const totalCommissions = completedReservations.reduce((sum, r) => sum + r.commission_amount, 0);
  const netRevenue = totalRevenue - totalCommissions;

  const thisMonthRevenue = completedReservations
    .filter(r => {
      const date = new Date(r.check_out);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    })
    .reduce((sum, r) => sum + r.total_amount, 0);

  const revenueByProperty = properties.map(property => {
    const propertyReservations = completedReservations.filter(
      r => r.property_id === property.id
    );
    const revenue = propertyReservations.reduce((sum, r) => sum + r.total_amount, 0);
    const commissions = propertyReservations.reduce((sum, r) => sum + r.commission_amount, 0);
    return {
      property,
      revenue,
      commissions,
      netRevenue: revenue - commissions,
      reservationCount: propertyReservations.length,
    };
  });

  const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthRevenue = completedReservations
      .filter(r => {
        const date = new Date(r.check_out);
        return date.getFullYear() === currentYear && date.getMonth() === i;
      })
      .reduce((sum, r) => sum + r.total_amount, 0);
    return {
      month: new Date(currentYear, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
      revenue: monthRevenue,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Revenu total</h3>
          <p className="text-2xl font-bold text-slate-800">{totalRevenue.toFixed(2)} €</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Revenu net</h3>
          <p className="text-2xl font-bold text-slate-800">{netRevenue.toFixed(2)} €</p>
          <p className="text-xs text-slate-500 mt-1">Après commissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Ce mois-ci</h3>
          <p className="text-2xl font-bold text-slate-800">{thisMonthRevenue.toFixed(2)} €</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Commissions</h3>
          <p className="text-2xl font-bold text-slate-800">{totalCommissions.toFixed(2)} €</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Revenus {currentYear}</h2>
        <div className="space-y-3">
          {revenueByMonth.map((data, index) => {
            const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));
            const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="flex items-center">
                <div className="w-12 text-sm font-medium text-slate-700">{data.month}</div>
                <div className="flex-1 mx-4">
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${percentage}%` }}
                    >
                      {data.revenue > 0 && (
                        <span className="text-xs font-medium text-white">
                          {data.revenue.toFixed(0)} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Performance par logement</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {revenueByProperty.map(({ property, revenue, commissions, netRevenue, reservationCount }) => (
            <div key={property.id} className="p-6 hover:bg-slate-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{property.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>{reservationCount} réservation(s)</span>
                    <span>Taux: {property.commission_rate}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{revenue.toFixed(2)} €</p>
                  <p className="text-sm text-slate-600">Net: {netRevenue.toFixed(2)} €</p>
                  <p className="text-xs text-slate-500">Commission: {commissions.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ))}
          {revenueByProperty.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-600">Aucune donnée financière disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
