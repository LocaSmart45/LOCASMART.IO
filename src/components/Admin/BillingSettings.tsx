import { useEffect, useState } from 'react';
import { Save, Loader, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AgencyBillingSettings {
  id?: string;
  admin_user_id: string;
  company_name: string;
  legal_form: string;
  billing_address: string;
  billing_zip: string;
  billing_city: string;
  billing_country: string;
  siret_number: string;
  vat_number: string;
  apply_vat: boolean;
  vat_rate: number;
  contact_email: string;
  contact_phone: string;
  iban: string;
  bic: string;
  invoice_footer_text: string;
}

export default function BillingSettings() {
  const [settings, setSettings] = useState<AgencyBillingSettings>({
    admin_user_id: '',
    company_name: '',
    legal_form: '',
    billing_address: '',
    billing_zip: '',
    billing_city: '',
    billing_country: 'France',
    siret_number: '',
    vat_number: '',
    apply_vat: false,
    vat_rate: 20.0,
    contact_email: '',
    contact_phone: '',
    iban: '',
    bic: '',
    invoice_footer_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('agency_billing_settings')
      .select('*')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings(data);
    } else {
      setSettings(prev => ({ ...prev, admin_user_id: user.id }));
    }

    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('agency_billing_settings')
      .upsert({
        ...settings,
        admin_user_id: user.id
      }, {
        onConflict: 'admin_user_id'
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    }

    setSaving(false);
  }

  function handleChange(field: keyof AgencyBillingSettings, value: any) {
    setSettings(prev => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramètres de facturation</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configurez les informations de votre conciergerie pour la génération des factures
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Informations légales</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la société *
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forme juridique
              </label>
              <input
                type="text"
                value={settings.legal_form}
                onChange={(e) => handleChange('legal_form', e.target.value)}
                placeholder="SARL, SAS, EURL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SIRET *
              </label>
              <input
                type="text"
                value={settings.siret_number}
                onChange={(e) => handleChange('siret_number', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse de facturation *
              </label>
              <input
                type="text"
                value={settings.billing_address}
                onChange={(e) => handleChange('billing_address', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                value={settings.billing_zip}
                onChange={(e) => handleChange('billing_zip', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville *
              </label>
              <input
                type="text"
                value={settings.billing_city}
                onChange={(e) => handleChange('billing_city', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <input
                type="text"
                value={settings.billing_country}
                onChange={(e) => handleChange('billing_country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de TVA
              </label>
              <input
                type="text"
                value={settings.vat_number}
                onChange={(e) => handleChange('vat_number', e.target.value)}
                placeholder="FRXX123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">TVA</h3>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.apply_vat}
                onChange={(e) => handleChange('apply_vat', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Appliquer la TVA sur les factures</span>
            </label>

            {settings.apply_vat && (
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux de TVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.vat_rate}
                  onChange={(e) => handleChange('vat_rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contact *
              </label>
              <input
                type="email"
                value={settings.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={settings.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations bancaires</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={settings.iban}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="FRXX XXXX XXXX XXXX XXXX XXXX XXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BIC
              </label>
              <input
                type="text"
                value={settings.bic}
                onChange={(e) => handleChange('bic', e.target.value)}
                placeholder="XXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pied de facture</h3>

          <textarea
            value={settings.invoice_footer_text}
            onChange={(e) => handleChange('invoice_footer_text', e.target.value)}
            rows={4}
            placeholder="Texte additionnel pour le bas de vos factures..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
