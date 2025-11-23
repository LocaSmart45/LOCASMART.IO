import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Property, Reservation, Intervention, Profile } from '../../lib/supabase';

// On importe uniquement les composants nécessaires à la Vue d'ensemble
import AdminStats from './AdminStats';

// Attention : tous les autres imports (InterventionsManager, OwnersManager, etc.) sont retirés 
// car App.tsx va maintenant les charger directement via le Router.

export default function AdminDashboard() {
  const { profile, signOut } = useAuth(); // profile and signOut are still useful
  
  // On garde la logique de chargement des données ici (c'est le plus efficace)
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [owners, setOwners] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // La logique de Promise.all pour charger toutes les données en même temps
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

  // --- RENDU : Uniquement la Vue d'ensemble (AdminStats) ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Vue d'ensemble du Parc</h1>
      
      {/* Le composant AdminStats qui affiche les cartes */}
      <AdminStats
        properties={properties}
        reservations={reservations}
        interventions={interventions}
        owners={owners}
      />

    </div>
  );
}