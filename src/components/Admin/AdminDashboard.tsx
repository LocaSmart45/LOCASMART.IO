import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, Wrench, MessageSquare, LogOut, Euro, Calendar, RefreshCw, FileText, CreditCard, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Property, Reservation, Intervention, Profile } from '../../lib/supabase';

// Import des managers de fonctionnalités (à s'assurer que les chemins sont corrects)
import PropertiesManager from './PropertiesManager';
import InterventionsManager from './InterventionsManager';
import OwnersManager from './OwnersManager';
import AdminStats from './AdminStats';
import MessagesPanel from '../Shared/MessagesPanel';
import FinancialDashboard from './FinancialDashboard';
import PropertyCalendarView from '../Shared/PropertyCalendarView';
import ReservationsManager from './ReservationsManager';
import SyncLogsManager from './SyncLogsManager';
import InvoicesManager from './InvoicesManager';
import BillingSettings from './BillingSettings';
import SubscriptionManager from './SubscriptionManager';

type Tab = 'overview' | 'owners' | 'properties' | 'interventions' | 'finances' | 'invoices' | 'calendar' | 'sync' | 'billing' | 'subscription' | 'messages';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Utiliser 'Promise.all' pour charger les données simultanément est excellent pour la performance !
    loadData();
  }, []);

  async function loadData() {
    // Cette fonction est appelée par les sous-composants après une modification (ajout/suppression).
    setLoading(true);
    try {
      const [propertiesData, reservationsData, interventionsData, ownersData] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('reservations').select('*').order('check_in', { ascending: false }),
        supabase.from('interventions').select('*').order('scheduled_date', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'owner'),
      ]);

      setProperties(propertiesData.data || []);
      setReservations(reservationsData.data || []);
      setInterventions(interventionsData.data || []);
      setOwners(ownersData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'owners' as Tab, label: 'Propriétaires', icon: Users },
    { id: 'properties' as Tab, label: 'Logements', icon: Building2 },
    { id: 'calendar' as Tab, label: 'Calendrier', icon: Calendar },
    { id: 'interventions' as Tab, label: 'Interventions', icon: Wrench },
    { id: 'finances' as Tab, label: 'Finances', icon: Euro },
    { id: 'invoices' as Tab, label: 'Facturation', icon: FileText },
    { id: 'sync' as Tab, label: 'Synchronisation', icon: RefreshCw },
    { id: 'billing' as Tab, label: 'Paramètres facturation', icon: CreditCard },
    { id: 'subscription' as Tab, label: 'Abonnement', icon: Settings },
    { id: 'messages' as Tab, label: 'Messages', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* --- BANDEAU SUPÉRIEUR (Header) --- */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold tracking-tight text-slate-900">LocaSmart</span>
              <p className="hidden md:block text-xs text-slate-500 uppercase tracking-wide font-semibold ml-6">
                Espace Administrateur
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{profile?.full_name || 'Super Admin'}</p>
                <p className="text-xs text-blue-600 font-medium">{profile?.role}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Onglets de Navigation --- */}
        <div className="flex flex-wrap gap-3 mb-8 border-b border-slate-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-sm ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-blue-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- Contenu de l'Onglet Actif --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
          {activeTab === 'overview' && (
            <AdminStats
              properties={properties}
              reservations={reservations}
              interventions={interventions}
              owners={owners}
            />
          )}

          {activeTab === 'owners' && (
            <OwnersManager owners={owners} properties={properties} onUpdate={loadData} />
          )}
          
          {/* ... [Garder le reste des conditions (activeTab === 'properties', etc.) ici] ... */}
          {activeTab === 'properties' && (
            <PropertiesManager properties={properties} owners={owners} reservations={reservations} onUpdate={loadData} />
          )}

          {activeTab === 'interventions' && (
            <InterventionsManager
              interventions={interventions}
              properties={properties}
              reservations={reservations}
              onUpdate={loadData}
            />
          )}

          {activeTab === 'finances' && (
            <FinancialDashboard properties={properties} reservations={reservations} owners={owners} />
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Calendrier des Réservations</h2>
                <p className="text-slate-600">Vue d'ensemble de toutes les réservations</p>
              </div>
              <PropertyCalendarView
                reservations={reservations}
                onReservationClick={(reservation) => {
                  console.log('Réservation sélectionnée:', reservation);
                }}
              />
              <div className="mt-8">
                <ReservationsManager
                  reservations={reservations}
                  properties={properties}
                  onUpdate={loadData}
                />
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <SyncLogsManager />
          )}

          {activeTab === 'invoices' && (
            <InvoicesManager />
          )}

          {activeTab === 'billing' && (
            <BillingSettings />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionManager />
          )}

          {activeTab === 'messages' && (
            <MessagesPanel />
          )}

        </div>
      </div>
    </div>
  );
}

// Composant pour l'affichage des statistiques de la Vue d'ensemble
// Ceci est la version simplifiée pour le besoin (AdminStats)
// Nous allons la placer dans AdminStats.tsx
// (Vous devez vous assurer que le fichier AdminStats.tsx existe)