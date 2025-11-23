import { useState, useMemo } from 'react';
import { TrendingUp, Euro, Calendar, Building2, CreditCard, Filter, TrendingDown } from 'lucide-react'; // Ajout de TrendingDown
import { Property, Reservation, Profile } from '../../lib/supabase';

// Définitions des couleurs pour les cartes de statistiques
const StatColors = {
  primary: 'text-blue-600 bg-blue-50',
  accent: 'text-orange-600 bg-orange-50',
  secondary: 'text-purple-600 bg-purple-50',
  success: 'text-green-600 bg-green-50',
};

// Composant réutilisable pour afficher les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: keyof typeof StatColors;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium uppercase text-slate-500">{title}</p>
      <div className={`p-3 rounded-full ${StatColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-4xl font-extrabold text-slate-900 mb-1 leading-none">{value}</p>
    {description && <p className="text-xs text-slate-500">{description}</p>}
    {trend !== undefined && (
      <div className="flex items-center mt-2 text-sm">
        {trend > 0 ? (
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        ) : trend < 0 ? (
          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
        ) : null}
        <span className={trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-slate-500'}>
          {trend.toFixed(1)}% vs. Période précédente
        </span>
      </div>
    )}
  </div>
);

// Composant principal du tableau de bord financier
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
      // ** CORRECTION LOGIQUE DE STATUT : Inclut 'pending', 'cancelled' si 'all' n'est pas sélectionné
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;

      // Retrait de la ligne 'if (selectedStatus === 'all' && r.status !== 'confirmed' && r.status !== 'completed') return false;'
      // pour que 'all' inclue TOUT (y compris cancelled et pending) et que l'utilisateur puisse filtrer spécifiquement.

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
    filteredReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
    [filteredReservations]
  );

  const totalCommissions = useMemo(() =>
    filteredReservations.reduce((sum, r) => sum + (r.commission_amount || 0), 0),
    [filteredReservations]
  );

  const averageCommissionRate = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return (totalCommissions / totalRevenue) * 100;
  }, [totalRevenue, totalCommissions]);

  const revenueByProperty = useMemo(() => {
    const grouped = new Map<string, { revenue: number; commissions: number, count: number }>();

    filteredReservations.forEach(r => {
      const current = grouped.get(r.property_id) || { revenue: 0, commissions: 0, count: 0 };
      grouped.set(r.property_id, {
        revenue: current.revenue + (r.total_amount || 0),
        commissions: current.commissions + (r.commission_amount || 0),
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
    const grouped = new Map<string, { revenue: number, commissions: number, count: number }>();

    filteredReservations.forEach(r => {
      const current = grouped.get(r.platform) || { revenue: 0, commissions: 0, count: 0 };
      grouped.set(r.platform, {
        revenue: current.revenue + (r.total_amount || 0),
        commissions: current.commissions + (r.commission_amount || 0),
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

  // Ajout d'une liste de tous les statuts pour le filtre Select
  const allStatuses = useMemo(() => {
    const uniqueStatuses = new Set(reservations.map(r => r.status));
    const statusOptions: Record<string, string> = { 'all': 'Tous les statuts' };
    
    uniqueStatuses.forEach(status => {
        if (status) {
            statusOptions[status] = statusLabels[status] || status;
        }
    });
    return statusOptions;
  }, [reservations]);


  return (
    <div className="space-y-8">
      
      {/* --- Header & Période --- */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-slate-900">Analyse Financière</h2>
        <div className="flex gap-2 p-1 bg-slate-50 rounded-full border border-slate-200">
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedPeriod === 'month'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedPeriod === 'year'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Cette année
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedPeriod === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            Total
          </button>
        </div>
      </div>

      {/* --- Filtres --- */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center space-x-2 mb-6 border-b pb-4 border-slate-100">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">Filtres de Recherche</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* Filtre Propriétaire */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Propriétaire</label>
            <select
              value={selectedOwner}
              onChange={(e) => {
                setSelectedOwner(e.target.value);
                setSelectedProperty('all');
              }}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            >
              <option value="all">Tous les propriétaires</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.full_name || owner.email}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Logement */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Logement</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            >
              <option value="all">Tous les logements</option>
              {filteredPropertiesByOwner.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Plateforme */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Plateforme</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            >
              {Object.entries(platformLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
              <option value="all">Toutes les plateformes</option>
            </select>
          </div>

          {/* Filtre Statut */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            >
              {Object.entries(allStatuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- Cartes de Statistiques --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenu Brut Total"
          value={`${totalRevenue.toFixed(2)} €`}
          icon={Euro}
          color="green"
          description={`Basé sur ${filteredReservations.length} réservations`}
        />
        <StatCard
          title="Commission Conciergerie"
          value={`${totalCommissions.toFixed(2)} €`}
          icon={TrendingUp}
          color="blue"
          description={`Taux moyen : ${averageCommissionRate.toFixed(1)}%`}
        />
        <StatCard
          title="Taux de Commission Moyen"
          value={`${averageCommissionRate.toFixed(1)} %`}
          icon={TrendingUp}
          color="purple"
          description={`Basé sur ${filteredReservations.length} réservations`}
        />
        <StatCard
          title="Nombre de Réservations"
          value={filteredReservations.length}
          icon={Calendar}
          color="orange"
          description="Total filtré"
        />
      </div>

      {/* --- Tableau de Répartition --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par Logement */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4 border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Revenu par Logement</h3>
          </div>
          <div className="space-y-5">
            {revenueByProperty.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucun revenu pour la période sélectionnée.</p>
            ) : (
              revenueByProperty.map(({ property, revenue, commissions, count }) => (
                <PropertyRevenueItem 
                  key={property?.id || 'unknown'} 
                  property={property}
                  revenue={revenue}
                  commissions={commissions}
                  count={count}
                  totalRevenue={totalRevenue}
                />
              ))
            )}
          </div>
        </div>

        {/* Répartition par Plateforme */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-6 border-b pb-4 border-slate-100">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-slate-800">Répartition par Plateforme</h3>
          </div>
          <div className="space-y-5">
            {revenueByPlatform.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucune donnée de plateforme pour cette période.</p>
            ) : (
              revenueByPlatform.map(({ platform, revenue, commissions, count }) => (
                <PlatformRevenueItem
                  key={platform}
                  platform={platformLabels[platform] || platform}
                  revenue={revenue}
                  commissions={commissions}
                  count={count}
                  totalRevenue={totalRevenue}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Composants de Statut et d'Affichage ---

// Composant pour l'affichage de l'avancement (barre et texte)
interface RevenueItemProps {
  name: string;
  count: number;
  revenue: number;
  commissions: number;
  totalRevenue: number;
  colorClass: string;
}

const RevenueItem: React.FC<RevenueItemProps> = ({ name, count, revenue, commissions, totalRevenue, colorClass }) => (
  <div className="border-b border-gray-100 pb-4 last:border-0">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <p className="font-medium text-slate-900">{name}</p>
        <p className="text-sm text-slate-500">{count} réservation{count > 1 ? 's' : ''}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-800">{revenue.toFixed(2)} €</p>
        <p className="text-xs text-blue-600">+ {commissions.toFixed(2)} € commission</p>
      </div>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`${colorClass} h-2 rounded-full transition-all`}
        style={{ width: `${(revenue / totalRevenue) * 100}%` }}
      />
    </div>
  </div>
);

// Composant spécifique pour les Logements
const PropertyRevenueItem: React.FC<{ property: Property | undefined, revenue: number, commissions: number, count: number, totalRevenue: number }> = 
  ({ property, revenue, commissions, count, totalRevenue }) => {
    return (
      <RevenueItem
        name={property?.name || 'Logement Inconnu'}
        count={count}
        revenue={revenue}
        commissions={commissions}
        totalRevenue={totalRevenue}
        colorClass="bg-blue-600"
      />
    );
  };

// Composant spécifique pour les Plateformes
const PlatformRevenueItem: React.FC<{ platform: string, revenue: number, commissions: number, count: number, totalRevenue: number }> = 
  ({ platform, revenue, commissions, count, totalRevenue }) => {
    return (
      <RevenueItem
        name={platform}
        count={count}
        revenue={revenue}
        commissions={commissions}
        totalRevenue={totalRevenue}
        colorClass="bg-orange-600"
      />
    );
  };

