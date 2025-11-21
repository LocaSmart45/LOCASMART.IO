import { useEffect, useState } from 'react';
import { Check, X, Loader } from 'lucide-react';
import {
  getCurrentSubscription,
  createOrUpdateSubscription,
  PLAN_FEATURES,
  type SubscriptionPlan
} from '../../services/subscriptionService';

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    setLoading(true);
    const data = await getCurrentSubscription();
    setSubscription(data);
    setLoading(false);
  }

  async function handlePlanChange(plan: 'starter' | 'pro' | 'premium') {
    setUpdating(true);
    setMessage(null);

    const result = await createOrUpdateSubscription(plan);

    if (result.success) {
      setMessage({ type: 'success', text: `Abonnement ${PLAN_FEATURES[plan].name} activé avec succès` });
      await loadSubscription();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la mise à jour' });
    }

    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'starter';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon Abonnement</h2>
        <p className="mt-1 text-sm text-gray-600">
          Gérez votre abonnement et accédez aux fonctionnalités premium
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(PLAN_FEATURES) as Array<keyof typeof PLAN_FEATURES>).map((planKey) => {
          const plan = PLAN_FEATURES[planKey];
          const isCurrentPlan = currentPlan === planKey;

          return (
            <div
              key={planKey}
              className={`relative rounded-lg border-2 p-6 ${
                isCurrentPlan
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Plan actuel
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="ml-2 text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <button
                  onClick={() => handlePlanChange(planKey)}
                  disabled={isCurrentPlan || updating}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {updating ? (
                    <Loader className="w-5 h-5 animate-spin mx-auto" />
                  ) : isCurrentPlan ? (
                    'Plan actuel'
                  ) : (
                    'Sélectionner'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {subscription && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites actuelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Propriétés</span>
              <span className="font-semibold text-gray-900">
                {subscription.properties_limit === null ? 'Illimité' : `${subscription.properties_limit} max`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Utilisateurs</span>
              <span className="font-semibold text-gray-900">
                {subscription.users_limit === null ? 'Illimité' : `${subscription.users_limit} max`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Sync automatique</span>
              {subscription.sync_auto_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Notifications</span>
              {subscription.notifications_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Export CSV</span>
              {subscription.exports_csv_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Export PDF</span>
              {subscription.exports_pdf_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Branding</span>
              {subscription.branding_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Rapports mensuels</span>
              {subscription.monthly_reports_enabled ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <X className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note :</strong> Les abonnements sont gérés via Système.io.
          Cette interface vous permet de configurer votre plan après l'achat.
        </p>
      </div>
    </div>
  );
}
