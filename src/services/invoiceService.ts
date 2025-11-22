import { supabase } from '../lib/supabase';

export interface Invoice {
  id: string;
  invoice_number: string;
  owner_id: string;
  admin_user_id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cleaning_fees: number;
  total_cleaning_costs: number;
  cleaning_margin_total: number;
  total_commission: number;
  owner_net_amount: number;
  vat_amount: number;
  total_with_vat: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  due_date: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  reservation_id: string;
  property_id: string;
  property_name: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  revenue_amount: number;
  cleaning_fee: number;
  cleaning_cost: number;
  cleaning_margin: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export async function getInvoicesForAdmin(): Promise<Invoice[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      profiles!invoices_owner_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('admin_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data || [];
}

export async function getInvoicesForOwner(): Promise<Invoice[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data || [];
}

export async function getInvoiceWithItems(invoiceId: string): Promise<InvoiceWithItems | null> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      profiles!invoices_owner_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    console.error('Error fetching invoice:', invoiceError);
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('check_in', { ascending: true });

  if (itemsError) {
    console.error('Error fetching invoice items:', itemsError);
    return null;
  }

  return {
    ...invoice,
    items: items || [],
    owner: invoice.profiles
  };
}

export async function updateInvoiceStatus(invoiceId: string, status: 'draft' | 'sent' | 'paid' | 'cancelled'): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId);

  if (error) {
    console.error('Error updating invoice status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function generateMonthlyInvoices(periodStart?: string, periodEnd?: string, ownerId?: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Non authentifié' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-monthly-invoices`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ periodStart, periodEnd, ownerId })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Erreur lors de la génération' };
    }

    const result = await response.json();
    return { success: true, results: result.results };
  } catch (error) {
    console.error('Error generating invoices:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}
