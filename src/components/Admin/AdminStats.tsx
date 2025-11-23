import React from 'react';
import { Users, Building2, Wrench, Calendar, Euro, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Property, Reservation, Intervention, Profile } from '../../lib/supabase';

// Composant Card pour améliorer l'esthétique
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'purple';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const baseClasses = `bg-white p-6 rounded-2xl shadow-md border`;
  const iconClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  };

  return (
    <div className={baseClasses}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold uppercase text-slate-500">{title}</p>
        <div className={`p-2 rounded-full ${iconClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-slate-900 mb-1">{value}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
  );
};


interface AdminStatsProps {
  properties: Property[];
  reservations: Reservation[];
  interventions: Intervention[];
  owners: Profile[];
}

export default function AdminStats({ properties, reservations, interventions, owners }: AdminStatsProps) {
  // Calculs des stats pour l'overview
  const activeProperties = properties.filter(p => p.status === 'active').length;
  const totalOwners = owners.length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const pendingInterventions = interventions.filter(i => i.status === 'pending').length;

  // Calcul du revenu total simulé
  const totalRevenue = reservations
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const totalCommission = reservations
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

  return (
    <div className="space-y-10">
      
      {/* --- Ligne 1: Statistiques Clés --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Logements Actifs"
          value={activeProperties}
          icon={Building2}
          color="blue"
          description={`sur ${properties.length} au total`}
        />
        <StatCard
          title="Réservations Confirmées"
          value={confirmedReservations}
          icon={Calendar}
          color="purple"
          description={`dont ${completedReservations} complétées`}
        />
        <StatCard
          title="Propriétaires Gérés"
          value={totalOwners}
          icon={Users}
          color="green"
          description="Nouveaux propriétaires ce mois-ci : 0"
        />
        <StatCard
          title="Interventions en attente"
          value={pendingInterventions}
          icon={Wrench}
          color="red"
          description="À planifier aujourd'hui"
        />
      </div>

      {/* --- Ligne 2: Statistiques Financières --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Revenu Total (Clients)"
          value={`${totalRevenue.toFixed(2)} €`}
          icon={Euro}
          color="green"
          description="Basé sur les réservations complétées"
        />
        <StatCard
          title="Commissions Nettes"
          value={`${totalCommission.toFixed(2)} €`}
          icon={DollarSign}
          color="blue"
          description="Marge brute de la conciergerie"
        />
      </div>

      {/* --- Reste du Dashboard (Tableaux des dernières résas, etc.) --- */}
      <div className="p-6 bg-white rounded-2xl border border-slate-100">
        <h3 className="text-xl font-bold mb-4">Prochaines arrivées</h3>
        {/* Ici, vous pouvez ajouter le tableau des prochaines réservations */}
        <p className="text-slate-500">Aucune donnée affichée. Veuillez ajouter des réservations de test.</p>
      </div>

    </div>
  );
}