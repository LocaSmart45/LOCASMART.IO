import { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Wrench, TrendingUp, MessageSquare, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Property, Reservation, Intervention } from '../../lib/supabase';
import PropertyCard from './PropertyCard';
import PropertyCalendar from './PropertyCalendar';
import ReservationsList from './ReservationsList';
import InterventionsList from './InterventionsList';
import FinancialStats from './FinancialStats';
import MessagesPanel from '../Shared/MessagesPanel';
import PropertyCalendarView from '../Shared/PropertyCalendarView';
import InvoicesList from './InvoicesList';

type Tab = 'overview' | 'calendar' | 'reservations' | 'interventions' | 'financial' | 'invoices' | 'messages';

export default function OwnerDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', profile?.id);

      const propertyIds = propertiesData?.map(p => p.id) || [];

      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .in('property_id', propertyIds)
        .order('check_in', { ascending: false });

      const { data: interventionsData } = await supabase
        .from('interventions')
        .select('*')
        .in('property_id', propertyIds)
        .order('scheduled_date', { ascending: true });

      setProperties(propertiesData || []);
      setReservations(reservationsData || []);
      setInterventions(interventionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'calendar' as Tab, label: 'Calendrier', icon: CalendarIcon },
    { id: 'reservations' as Tab, label: 'Réservations', icon: CalendarIcon },
    { id: 'interventions' as Tab, label: 'Interventions', icon: Wrench },
    { id: 'financial' as Tab, label: 'Finances', icon: TrendingUp },
    { id: 'invoices' as Tab, label: 'Mes factures', icon: FileText },
    { id: 'messages' as Tab, label: 'Messages', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-neutral-dark font-body">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/generated-image (1) copy.png"
                alt="LocaSmart"
                className="h-10"
              />
              <div className="hidden md:block">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Espace Propriétaire</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{profile?.full_name}</p>
                <p className="text-xs text-slate-500">{profile?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
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
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-button font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-secondary text-white shadow-button'
                    : 'bg-white text-neutral-dark hover:bg-gray-50 shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-darker mb-4">Mes logements</h2>
                {properties.length === 0 ? (
                  <div className="card text-center">
                    <p className="text-neutral-dark font-body">Aucun logement enregistré</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                )}
              </div>

              {properties.length > 0 && (
                <div className="space-y-6">
                  {properties.map((property) => (
                    <div key={property.id}>
                      <h3 className="text-xl font-semibold text-neutral-darker mb-4">
                        Calendrier - {property.name}
                      </h3>
                      <PropertyCalendar
                        propertyId={property.id}
                        reservations={reservations}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-neutral-darker mb-4">Prochaines réservations</h3>
                  {reservations.slice(0, 3).map((reservation) => (
                    <div key={reservation.id} className="py-3 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-neutral-darker">{reservation.guest_name}</p>
                      <p className="text-sm text-neutral-dark font-body">
                        {new Date(reservation.check_in).toLocaleDateString('fr-FR')} - {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <p className="text-neutral-dark text-sm font-body">Aucune réservation</p>
                  )}
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-neutral-darker mb-4">Interventions à venir</h3>
                  {interventions.filter(i => i.status === 'pending').slice(0, 3).map((intervention) => (
                    <div key={intervention.id} className="py-3 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-neutral-darker">{intervention.title}</p>
                      <p className="text-sm text-neutral-dark font-body">
                        {new Date(intervention.scheduled_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                  {interventions.filter(i => i.status === 'pending').length === 0 && (
                    <p className="text-neutral-dark text-sm font-body">Aucune intervention prévue</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-darker mb-1">Calendrier des Réservations</h2>
                <p className="text-neutral-dark font-body">Vue d'ensemble de vos réservations</p>
              </div>
              <PropertyCalendarView
                reservations={reservations}
                onReservationClick={(reservation) => {
                  console.log('Réservation sélectionnée:', reservation);
                }}
              />
            </div>
          )}

          {activeTab === 'reservations' && (
            <ReservationsList reservations={reservations} properties={properties} />
          )}

          {activeTab === 'interventions' && (
            <InterventionsList interventions={interventions} properties={properties} />
          )}

          {activeTab === 'financial' && (
            <FinancialStats reservations={reservations} properties={properties} />
          )}

          {activeTab === 'invoices' && (
            <InvoicesList />
          )}

          {activeTab === 'messages' && (
            <MessagesPanel />
          )}
        </div>
      </div>
    </div>
  );
}
