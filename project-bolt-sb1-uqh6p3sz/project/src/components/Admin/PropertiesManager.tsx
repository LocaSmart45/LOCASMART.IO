import { useState } from 'react';
import { Home, Plus, Bed, Bath, Edit2, MapPin, Calendar, RefreshCw, Link as LinkIcon, User, Upload, X, CalendarPlus } from 'lucide-react';
import { Property, Profile, Reservation, supabase } from '../../lib/supabase';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Shared/Pagination';

interface PropertiesManagerProps {
  properties: Property[];
  owners: Profile[];
  reservations: Reservation[];
  onUpdate: () => void;
}

export default function PropertiesManager({ properties, owners, reservations, onUpdate }: PropertiesManagerProps) {
  const pagination = usePagination(properties, 15);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedPropertyForReservation, setSelectedPropertyForReservation] = useState<string | null>(null);
  const [reservationFormData, setReservationFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    check_in_time: '15:00',
    check_out_time: '11:00',
    total_amount: 0,
    platform: 'manual' as 'airbnb' | 'booking' | 'direct' | 'manual',
    status: 'confirmed' as 'pending' | 'confirmed' | 'cancelled',
  });
  const [formData, setFormData] = useState({
    owner_id: '',
    name: '',
    address: '',
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    airbnb_url: '',
    booking_url: '',
    ical_url: '',
    ical_sync_enabled: false,
    commission_rate: 20,
    status: 'active' as 'active' | 'inactive',
    image_url: '',
  });
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<{ [key: string]: any }>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function resetForm() {
    setFormData({
      owner_id: '',
      name: '',
      address: '',
      type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      airbnb_url: '',
      booking_url: '',
      ical_url: '',
      ical_sync_enabled: false,
      commission_rate: 20,
      status: 'active',
      image_url: '',
    });
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  }

  function resetReservationForm() {
    setReservationFormData({
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: '',
      check_out: '',
      check_in_time: '15:00',
      check_out_time: '11:00',
      total_amount: 0,
      platform: 'manual',
      status: 'confirmed',
    });
    setSelectedPropertyForReservation(null);
    setShowReservationForm(false);
  }

  function openReservationForm(propertyId: string) {
    setSelectedPropertyForReservation(propertyId);
    setShowReservationForm(true);
  }

  async function handleReservationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPropertyForReservation) return;

    try {
      const property = properties.find(p => p.id === selectedPropertyForReservation);
      if (!property) return;

      const commissionAmount = (reservationFormData.total_amount * property.commission_rate) / 100;

      const { error } = await supabase.from('reservations').insert([{
        property_id: selectedPropertyForReservation,
        ...reservationFormData,
        commission_amount: commissionAmount,
      }]);

      if (error) {
        console.error('Supabase error:', error);
        alert(`Erreur lors de la création de la réservation: ${error.message}`);
        return;
      }

      alert('Réservation créée avec succès !');
      resetReservationForm();
      onUpdate();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Erreur lors de la création de la réservation');
    }
  }

  function handleEdit(property: Property) {
    setFormData({
      owner_id: property.owner_id,
      name: property.name,
      address: property.address,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      airbnb_url: property.airbnb_url || '',
      booking_url: property.booking_url || '',
      ical_url: (property as any).ical_url || '',
      ical_sync_enabled: (property as any).ical_sync_enabled || false,
      commission_rate: property.commission_rate,
      status: property.status,
      image_url: (property as any).image_url || '',
    });
    setImagePreview((property as any).image_url || null);
    setEditingId(property.id);
    setShowForm(true);
  }

  async function handleImageUpload() {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/property-images/${filePath}`;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors du téléchargement de l\'image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const dataToSave = { ...formData, image_url: imageUrl };

      if (editingId) {
        await supabase
          .from('properties')
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq('id', editingId);
      } else {
        await supabase.from('properties').insert([dataToSave]);
      }

      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
  }

  const getOwnerName = (ownerId: string) => {
    return owners.find(o => o.id === ownerId)?.full_name || 'Propriétaire inconnu';
  };

  async function handleSyncIcal(propertyId: string) {
    setSyncing(propertyId);
    setSyncResults({ ...syncResults, [propertyId]: null });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-ical`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de synchronisation');
      }

      setSyncResults({ ...syncResults, [propertyId]: result });
      onUpdate();
    } catch (error: any) {
      alert(`Erreur de synchronisation: ${error.message}`);
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Logements</h2>
          <p className="text-slate-600 mt-1">{properties.length} logement(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau logement
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Modifier le logement' : 'Ajouter un logement'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Propriétaire *
                </label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom du logement *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="apartment">Appartement</option>
                  <option value="house">Maison</option>
                  <option value="studio">Studio</option>
                  <option value="loft">Loft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chambres
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salles de bain
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Taux de commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL Airbnb
                </label>
                <input
                  type="url"
                  value={formData.airbnb_url}
                  onChange={(e) => setFormData({ ...formData, airbnb_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL Booking
                </label>
                <input
                  type="url"
                  value={formData.booking_url}
                  onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photo du logement
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600">
                        Cliquez pour télécharger une photo
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        PNG, JPG jusqu'à 5 Mo
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Synchronisation iCal (Airbnb, Booking, etc.)
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL iCal
                  </label>
                  <input
                    type="url"
                    value={formData.ical_url}
                    onChange={(e) => setFormData({ ...formData, ical_url: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="https://www.airbnb.fr/calendar/ical/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Trouvez ce lien dans les paramètres de votre annonce Airbnb/Booking (section Calendrier)
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ical_sync_enabled"
                    checked={formData.ical_sync_enabled}
                    onChange={(e) => setFormData({ ...formData, ical_sync_enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="ical_sync_enabled" className="ml-2 text-sm text-slate-700">
                    Activer la synchronisation automatique quotidienne
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={uploadingImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Téléchargement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aucun logement enregistré</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagination.paginatedItems.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
              {(property as any).image_url ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={(property as any).image_url}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Home className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">{property.name}</h3>
                  <button
                    onClick={() => handleEdit(property)}
                    className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-start text-sm text-slate-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{property.address}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Propriétaire: <span className="font-medium">{getOwnerName(property.owner_id)}</span>
                </p>
                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span>{property.bathrooms}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    property.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {property.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="text-sm text-slate-600">
                    {property.commission_rate}%
                  </span>
                </div>

                {(property as any).ical_url && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-xs text-slate-600">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        <span>Synchro iCal</span>
                        {(property as any).ical_sync_enabled && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Active</span>
                        )}
                      </div>
                    </div>
                    {(property as any).last_ical_sync && (
                      <p className="text-xs text-slate-500 mb-2">
                        Dernière synchro: {new Date((property as any).last_ical_sync).toLocaleString('fr-FR')}
                      </p>
                    )}
                    <button
                      onClick={() => handleSyncIcal(property.id)}
                      disabled={syncing === property.id}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition flex items-center justify-center text-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncing === property.id ? 'animate-spin' : ''}`} />
                      {syncing === property.id ? 'Synchronisation...' : 'Synchroniser maintenant'}
                    </button>
                    {syncResults[property.id] && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                        {syncResults[property.id].imported} importée(s), {syncResults[property.id].updated} mise(s) à jour, {syncResults[property.id].skipped} ignorée(s)
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  const propertyReservations = reservations.filter(r => r.property_id === property.id);
                  const now = new Date();
                  const upcomingReservations = propertyReservations
                    .filter(r => r.status === 'confirmed' && new Date(r.check_in) >= now)
                    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
                    .slice(0, 3);

                  return (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-700 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Réservations ({propertyReservations.length})
                        </h4>
                        <button
                          onClick={() => openReservationForm(property.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                          title="Ajouter une réservation"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      </div>
                      {upcomingReservations.length > 0 ? (
                        <div className="space-y-2">
                          {upcomingReservations.map((reservation) => (
                            <div key={reservation.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                              <div className="flex items-center text-slate-700 font-medium mb-1">
                                <User className="w-3 h-3 mr-1" />
                                {reservation.guest_name}
                              </div>
                              <div className="text-slate-600">
                                {new Date(reservation.check_in).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(reservation.check_out).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Aucune réservation à venir</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
              ))}
            </div>
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <Pagination
                currentPage={pagination.currentPage}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {showReservationForm && selectedPropertyForReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Ajouter une réservation</h3>
                <button
                  onClick={resetReservationForm}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {properties.find(p => p.id === selectedPropertyForReservation)?.name}
                </p>
                <p className="text-xs text-blue-600">
                  {properties.find(p => p.id === selectedPropertyForReservation)?.address}
                </p>
              </div>

              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom du voyageur *
                    </label>
                    <input
                      type="text"
                      value={reservationFormData.guest_name}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, guest_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={reservationFormData.guest_email}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, guest_email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={reservationFormData.guest_phone}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, guest_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plateforme
                    </label>
                    <select
                      value={reservationFormData.platform}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, platform: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      <option value="manual">Manuelle</option>
                      <option value="direct">Directe</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="booking">Booking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date d'arrivée *
                    </label>
                    <input
                      type="date"
                      value={reservationFormData.check_in}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, check_in: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Heure d'arrivée *
                    </label>
                    <input
                      type="time"
                      value={reservationFormData.check_in_time}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, check_in_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de départ *
                    </label>
                    <input
                      type="date"
                      value={reservationFormData.check_out}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, check_out: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Heure de départ *
                    </label>
                    <input
                      type="time"
                      value={reservationFormData.check_out_time}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, check_out_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prix total (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={reservationFormData.total_amount}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, total_amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={reservationFormData.status}
                      onChange={(e) => setReservationFormData({ ...reservationFormData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Créer la réservation
                  </button>
                  <button
                    type="button"
                    onClick={resetReservationForm}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-6 rounded-lg transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
