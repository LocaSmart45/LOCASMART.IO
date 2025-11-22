import { useState, useMemo } from 'react';
import { TrendingUp, Euro, Calendar, Building2, CreditCard, Filter } from 'lucide-react';
import { Property, Reservation, Profile } from '../../lib/supabase';

interface FinancialDashboardProps {
  properties: Property[];
  reservations: Reservation[];
  owners: Profile[];
}

export default function FinancialDashboard({ properties, reservations, owners }: FinancialDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredReservations = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return reservations.filter(r => {
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;

      if (selectedStatus === 'all' && r.status !== 'confirmed' && r.status !== 'completed') return false;

      if (selectedPlatform !== 'all' && r.platform !== selectedPlatform) return false;

      if (selectedProperty !== 'all' && r.property_id !== selectedProperty) return false;

      if (selectedOwner !== 'all') {
        const property = properties.find(p => p.id === r.property_id);
        if (!property || property.owner_id !== selectedOwner) return false;
      }

      const checkIn = new Date(r.check_in);

      if (selectedPeriod === 'month') {
        return checkIn.getMonth() === currentMonth && checkIn.getFullYear() === currentYear;
      } else if (selectedPeriod === 'year') {
        return checkIn.getFullYear() === currentYear;
      }
      return true;
    });
  }, [reservations, selectedPeriod, selectedOwner, selectedProperty, selectedPlatform, selectedStatus, properties]);

  const totalRevenue = useMemo(() =>
    filteredReservations.reduce((sum, r) => sum + r.total_amount, 0),
    [filteredReservations]
  );

  const totalCommissions = useMemo(() =>
    filteredReservations.reduce((sum, r) => sum + r.commission_amount, 0),
    [filteredReservations]
  );

  const averageCommissionRate = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return (totalCommissions / totalRevenue) * 100;
  }, [totalRevenue, totalCommissions]);

  const revenueByProperty = useMemo(() => {
    const grouped = new Map<string, { revenue: number; commissions: number; count: number }>();

    filteredReservations.forEach(r => {
      const current = grouped.get(r.property_id) || { revenue: 0, commissions: 0, count: 0 };
      grouped.set(r.property_id, {
        revenue: current.revenue + r.total_amount,
        commissions: current.commissions + r.commission_amount,
        count: current.count + 1
      });
    });

    return Array.from(grouped.entries()).map(([propertyId, data]) => {
      const property = properties.find(p => p.id === propertyId);
      return {
        property,
        ...data
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filteredReservations, properties]);

  const revenueByPlatform = useMemo(() => {
    const grouped = new Map<string, { revenue: number; commissions: number; count: number }>();

    filteredReservations.forEach(r => {
      const current = grouped.get(r.platform) || { revenue: 0, commissions: 0, count: 0 };
      grouped.set(r.platform, {
        revenue: current.revenue + r.total_amount,
        commissions: current.commissions + r.commission_amount,
        count: current.count + 1
      });
    });

    return Array.from(grouped.entries()).map(([platform, data]) => ({
      platform,
      ...data
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredReservations]);

  const platformLabels: Record<string, string> = {
    airbnb: 'Airbnb',
    booking: 'Booking.com',
    direct: 'Direct',
    manual: 'Manuel'
  };

  const filteredPropertiesByOwner = useMemo(() => {
    if (selectedOwner === 'all') return properties;
    return properties.filter(p => p.owner_id === selectedOwner);
  }, [properties, selectedOwner]);

  const statusLabels: Record<string, string> = {
    all: 'Tous les statuts',
    confirmed: 'Confirmé',
    completed: 'Complété',
    pending: 'En attente',
    cancelled: 'Annulé'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-neutral-dark">Finances</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-button font-medium transition-all ${
              selectedPeriod === 'month'
                ? 'bg-primary text-white shadow-button'
                : 'bg-white text-neutral-dark hover:bg-gray-50 shadow-sm'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-button font-medium transition-all ${
              selectedPeriod === 'year'
                ? 'bg-primary text-white shadow-button'
                : 'bg-white text-neutral-dark hover:bg-gray-50 shadow-sm'
            }`}
          >
            Cette année
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-button font-medium transition-all ${
              selectedPeriod === 'all'
                ? 'bg-primary text-white shadow-button'
                : 'bg-white text-neutral-dark hover:bg-gray-50 shadow-sm'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-display font-bold text-neutral-dark">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Propriétaire
            </label>
            <select
              value={selectedOwner}
              onChange={(e) => {
                setSelectedOwner(e.target.value);
                setSelectedProperty('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous les propriétaires</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Logement
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous les logements</option>
              {filteredPropertiesByOwner.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Plateforme
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Toutes les plateformes</option>
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
              <option value="direct">Direct</option>
              <option value="manual">Manuel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-2">
              Statut
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-dark">Revenus totaux</p>
            <Euro className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-display font-bold text-primary">
            {totalRevenue.toFixed(2)} €
          </p>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-dark">Commissions</p>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-bold text-accent">
            {totalCommissions.toFixed(2)} €
          </p>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-dark">Taux moyen</p>
            <TrendingUp className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-display font-bold text-secondary">
            {averageCommissionRate.toFixed(1)} %
          </p>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-neutral-dark">Réservations</p>
            <Calendar className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-display font-bold text-success">
            {filteredReservations.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-display font-bold text-neutral-dark">Revenus par logement</h3>
          </div>
          <div className="space-y-4">
            {revenueByProperty.length === 0 ? (
              <p className="text-neutral-light text-center py-8">Aucune réservation pour cette période</p>
            ) : (
              revenueByProperty.map(({ property, revenue, commissions, count }) => (
                <div key={property?.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-dark">{property?.name || 'Inconnu'}</p>
                      <p className="text-sm text-neutral-light">{count} réservation{count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{revenue.toFixed(2)} €</p>
                      <p className="text-sm text-accent">+{commissions.toFixed(2)} € commission</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(revenue / totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CreditCard className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-display font-bold text-neutral-dark">Revenus par plateforme</h3>
          </div>
          <div className="space-y-4">
            {revenueByPlatform.length === 0 ? (
              <p className="text-neutral-light text-center py-8">Aucune réservation pour cette période</p>
            ) : (
              revenueByPlatform.map(({ platform, revenue, commissions, count }) => (
                <div key={platform} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-dark">{platformLabels[platform] || platform}</p>
                      <p className="text-sm text-neutral-light">{count} réservation{count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{revenue.toFixed(2)} €</p>
                      <p className="text-sm text-accent">+{commissions.toFixed(2)} € commission</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${(revenue / totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
