import { supabase } from '../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  admin_user_id: string;
  plan: 'starter' | 'pro' | 'premium';
  properties_limit: number | null;
  users_limit: number | null;
  sync_auto_enabled: boolean;
  notifications_enabled: boolean;
  exports_csv_enabled: boolean;
  exports_pdf_enabled: boolean;
  branding_enabled: boolean;
  monthly_reports_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    properties_limit: 5,
    users_limit: 1,
    sync_auto_enabled: false,
    notifications_enabled: false,
    exports_csv_enabled: false,
    exports_pdf_enabled: false,
    branding_enabled: false,
    monthly_reports_enabled: false,
    price: '19€/mois',
    features: [
      '5 propriétés maximum',
      '1 utilisateur',
      'Synchronisation iCal manuelle uniquement',
      'Gestion des réservations',
      'Calendrier de base',
      'Facturation propriétaires'
    ]
  },
  pro: {
    name: 'Pro',
    properties_limit: 20,
    users_limit: 3,
    sync_auto_enabled: true,
    notifications_enabled: true,
    exports_csv_enabled: true,
    exports_pdf_enabled: false,
    branding_enabled: false,
    monthly_reports_enabled: false,
    price: '49€/mois',
    features: [
      '20 propriétés maximum',
      '3 utilisateurs',
      'Synchronisation automatique iCal',
      'Notifications email',
      'Export CSV',
      'Gestion des interventions',
      'Statistiques financières avancées'
    ]
  },
  premium: {
    name: 'Premium',
    properties_limit: null,
    users_limit: null,
    sync_auto_enabled: true,
    notifications_enabled: true,
    exports_csv_enabled: true,
    exports_pdf_enabled: true,
    branding_enabled: true,
    monthly_reports_enabled: true,
    price: '99€/mois',
    features: [
      'Propriétés illimitées',
      'Utilisateurs illimités',
      'Synchronisation automatique',
      'Notifications avancées',
      'Export CSV & PDF',
      'Branding personnalisé',
      'Rapports mensuels PDF',
      'Support prioritaire'
    ]
  }
};

export async function getCurrentSubscription(): Promise<SubscriptionPlan | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('admin_user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function createOrUpdateSubscription(plan: 'starter' | 'pro' | 'premium'): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const planFeatures = PLAN_FEATURES[plan];

  const subscriptionData = {
    admin_user_id: user.id,
    plan,
    properties_limit: planFeatures.properties_limit,
    users_limit: planFeatures.users_limit,
    sync_auto_enabled: planFeatures.sync_auto_enabled,
    notifications_enabled: planFeatures.notifications_enabled,
    exports_csv_enabled: planFeatures.exports_csv_enabled,
    exports_pdf_enabled: planFeatures.exports_pdf_enabled,
    branding_enabled: planFeatures.branding_enabled,
    monthly_reports_enabled: planFeatures.monthly_reports_enabled
  };

  const { error } = await supabase
    .from('subscription_plans')
    .upsert(subscriptionData, {
      onConflict: 'admin_user_id'
    });

  if (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkSubscriptionLimit(limitType: 'properties' | 'users'): Promise<{ allowed: boolean; current: number; limit: number | null; message?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, current: 0, limit: 0, message: 'Non authentifié' };

  const subscription = await getCurrentSubscription();
  if (!subscription) {
    return { allowed: true, current: 0, limit: null };
  }

  const limit = limitType === 'properties' ? subscription.properties_limit : subscription.users_limit;

  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  let current = 0;

  if (limitType === 'properties') {
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('admin_user_id', user.id);
    current = count || 0;
  } else {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', user.id);
    current = count || 0;
  }

  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    message: allowed ? undefined : 'Votre plan actuel ne permet pas cette action. Veuillez mettre à niveau votre abonnement.'
  };
}

export async function checkFeatureAccess(feature: 'sync_auto' | 'notifications' | 'csv_export' | 'pdf_export' | 'branding' | 'monthly_reports'): Promise<{ allowed: boolean; message?: string }> {
  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return {
      allowed: false,
      message: 'Aucun abonnement actif. Veuillez activer un plan.'
    };
  }

  const featureMap: Record<string, keyof SubscriptionPlan> = {
    sync_auto: 'sync_auto_enabled',
    notifications: 'notifications_enabled',
    csv_export: 'exports_csv_enabled',
    pdf_export: 'exports_pdf_enabled',
    branding: 'branding_enabled',
    monthly_reports: 'monthly_reports_enabled'
  };

  const featureName = featureMap[feature];
  const allowed = subscription[featureName] as boolean;

  return {
    allowed,
    message: allowed ? undefined : 'Votre plan actuel ne permet pas cette action. Veuillez mettre à niveau votre abonnement.'
  };
}
