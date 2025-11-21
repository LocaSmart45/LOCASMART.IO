import { Wrench, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Intervention, Property } from '../../lib/supabase';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Shared/Pagination';

interface InterventionsListProps {
  interventions: Intervention[];
  properties: Property[];
}

export default function InterventionsList({ interventions, properties }: InterventionsListProps) {
  const pagination = usePagination(interventions, 20);

  const getPropertyName = (propertyId: string) => {
    return properties.find(p => p.id === propertyId)?.name || 'Logement inconnu';
  };

  const getTypeBadge = (type: string) => {
    const types = {
      cleaning: { label: 'Ménage', color: 'bg-blue-100 text-blue-700' },
      maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
      check_in: { label: 'Arrivée', color: 'bg-emerald-100 text-emerald-700' },
      check_out: { label: 'Départ', color: 'bg-slate-100 text-slate-700' },
    };
    return types[type as keyof typeof types] || { label: type, color: 'bg-slate-100 text-slate-700' };
  };

  const getStatusInfo = (status: string) => {
    const statuses = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
      completed: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    };
    return statuses[status as keyof typeof statuses] || statuses.pending;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Interventions</h2>
        <p className="text-slate-600 mt-1">{interventions.length} intervention(s) au total</p>
      </div>

      {interventions.length === 0 ? (
        <div className="p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Aucune intervention enregistrée</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            {pagination.paginatedItems.map((intervention) => {
            const typeBadge = getTypeBadge(intervention.type);
            const statusInfo = getStatusInfo(intervention.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={intervention.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {intervention.title}
                      </h3>
                      <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-slate-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {getPropertyName(intervention.property_id)}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {intervention.scheduled_time && ` à ${intervention.scheduled_time.slice(0, 5)}`}
                      </span>
                    </div>

                    {intervention.description && (
                      <p className="text-sm text-slate-600 mb-2">{intervention.description}</p>
                    )}

                    {intervention.assigned_to && (
                      <p className="text-sm text-slate-500">
                        Assigné à: <span className="font-medium">{intervention.assigned_to}</span>
                      </p>
                    )}

                    {intervention.completed_at && (
                      <p className="text-sm text-emerald-600 mt-2">
                        Terminée le {new Date(intervention.completed_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>

                  {intervention.cost !== null && intervention.cost !== undefined && intervention.cost > 0 && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800">
                        {intervention.cost.toFixed(2)} €
                      </p>
                      <p className="text-sm text-slate-500">Coût</p>
                    </div>
                  )}
                </div>
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
    </div>
  );
}
