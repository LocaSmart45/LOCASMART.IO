import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Building2, Wrench, MessageSquare, LogOut, Euro, Calendar, RefreshCw, FileText, CreditCard, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Property, Reservation, Intervention, Profile } from '../../lib/supabase';
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

// On utilise le chemin pour savoir quel onglet est actif (la Sidebar gère le routing)
// On utilise le 'useLocation' pour lire le chemin dans la barre d'adresse
import { useLocation } from 'react-router-dom';

type Tab = 'overview' | 'owners' | 'properties' | 'interventions' | 'finances' | 'invoices' | 'calendar' | 'sync' | 'billing' | 'subscription' | 'messages';

// Fonction pour déterminer quel onglet est actif à partir du chemin (ex: /finances -> 'finances')
const mapPathToTab = (pathname: string): Tab => {
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    
    if (lastPart === 'dashboard') return 'overview';
    if (lastPart === 'properties') return 'properties';
    if (lastPart === 'owners') return 'owners';
    if (lastPart === 'interventions') return 'interventions';
    if (lastPart === 'finances') return 'finances';
    if (lastPart === 'invoices') return 'invoices';
    if (lastPart === 'calendar') return 'calendar';
    // Ajoutez ici les autres correspondances si nécessaire
    return 'overview'; // Par défaut, retourne à la vue d'ensemble
};

export default function AdminDashboard() {
    const { signOut } = useAuth();
    const location = useLocation(); // On lit l'adresse
    
    // Détermine l'onglet actif en fonction de l'URL du navigateur (ex: si l'URL contient /finances, on active l'onglet finances)
    const activeTab = mapPathToTab(location.pathname);
    
    const [properties, setProperties] = useState<Property[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [owners, setOwners] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [location.pathname]); // Recharge les données si l'URL change

    async function loadData() {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // --- RENDU : On ne rend PLUS la barre de navigation et les onglets horizontaux ---
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            
            {/* Le Header (Navigation supérieure) et la Sidebar sont gérés par Layout.tsx */}
            
            {/* Le contenu de la page (sans les onglets dupliqués) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* --- Rendu du Manager Actif --- */}
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
                
                {/* ... (Ajoutez les autres onglets que vous voulez activer ici) ... */}

                {/* Si l'onglet n'est pas géré ici, il n'affiche rien (c'est le cas des onglets de Settings/Abonnement) */}
            </div>
        </div>
    );
}