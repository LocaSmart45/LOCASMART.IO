import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  properties_synced: number;
  reservations_created: number;
  errors: any;
  created_at: string;
}

export default function SyncLogsManager() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function triggerManualSync() {
    if (syncing) return;

    try {
      setSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expirée');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/scheduled-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`Synchronisation réussie !\n${result.properties_synced} logements synchronisés\n${result.reservations_created} nouvelles réservations créées`);
      } else {
        alert(`Erreur lors de la synchronisation : ${result.error}`);
      }

      await loadLogs();
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Erreur lors du déclenchement de la synchronisation');
    } finally {
      setSyncing(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-100 text-blue-700';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'En cours...';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Historique des Synchronisations</h2>
          <p className="text-slate-600 mt-1">Logs des synchronisations automatiques iCal</p>
        </div>
        <button
          onClick={triggerManualSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">Aucun historique de synchronisation</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(log.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                        {log.status === 'RUNNING' ? 'En cours' :
                         log.status === 'COMPLETED' ? 'Terminé' : 'Échoué'}
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(log.started_at).toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm text-slate-500">
                        Durée: {formatDuration(log.started_at, log.finished_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600 font-medium">Logements synchronisés</p>
                        <p className="text-2xl font-bold text-blue-700">{log.properties_synced}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-sm text-emerald-600 font-medium">Réservations créées</p>
                        <p className="text-2xl font-bold text-emerald-700">{log.reservations_created}</p>
                      </div>
                    </div>

                    {log.errors && Array.isArray(log.errors) && log.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-700 mb-2">Erreurs détectées:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {log.errors.map((err: any, idx: number) => (
                            <li key={idx} className="text-sm text-red-600">
                              {err.property_name || 'Erreur générale'}: {err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Configuration de la synchronisation automatique
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Pour activer la synchronisation automatique toutes les 4 heures, vous pouvez utiliser :
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
          <li><strong>GitHub Actions</strong> : Créez un workflow qui appelle l'edge function scheduled-sync</li>
          <li><strong>Vercel Cron</strong> : Configurez un cron job dans vercel.json</li>
          <li><strong>Supabase Cron</strong> : Utilisez pg_cron si disponible</li>
          <li><strong>Service externe</strong> : EasyCron, cron-job.org, etc.</li>
        </ul>
        <div className="mt-4 bg-white rounded-lg p-3 font-mono text-xs text-slate-700">
          <p className="font-semibold mb-1">URL de la fonction :</p>
          <p className="break-all">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheduled-sync</p>
        </div>
      </div>
    </div>
  );
}
