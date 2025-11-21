import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateInvoicesRequest {
  periodStart?: string;
  periodEnd?: string;
  ownerId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { periodStart, periodEnd, ownerId }: GenerateInvoicesRequest = await req.json();

    const today = new Date();
    const defaultPeriodStart = periodStart || new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const defaultPeriodEnd = periodEnd || new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
    const invoiceYear = new Date(defaultPeriodStart).getFullYear();

    console.log(`Generating invoices for period ${defaultPeriodStart} to ${defaultPeriodEnd}`);

    let ownersQuery = supabase
      .from('properties')
      .select('owner_id, profiles!inner(id, first_name, last_name, email, billing_full_name, billing_address, billing_zip, billing_city, billing_country, billing_email)')
      .eq('admin_user_id', user.id);

    if (ownerId) {
      ownersQuery = ownersQuery.eq('owner_id', ownerId);
    }

    const { data: properties } = await ownersQuery;

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun propriétaire trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uniqueOwners = Array.from(
      new Map(properties.map(p => [p.owner_id, p])).values()
    );

    const results = [];

    for (const ownerProp of uniqueOwners) {
      const currentOwnerId = ownerProp.owner_id;
      const ownerProfile = ownerProp.profiles;

      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('owner_id', currentOwnerId)
        .eq('period_start', defaultPeriodStart)
        .eq('period_end', defaultPeriodEnd)
        .maybeSingle();

      if (existingInvoice) {
        results.push({
          ownerId: currentOwnerId,
          status: 'skipped',
          reason: 'Invoice already exists for this period'
        });
        continue;
      }

      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          property_id,
          guest_name,
          check_in,
          check_out,
          total_amount,
          cleaning_fee,
          cleaning_cost,
          cleaning_margin,
          revenue_amount,
          commission_amount,
          properties!inner(
            id,
            name,
            commission_rate,
            owner_id
          )
        `)
        .eq('properties.owner_id', currentOwnerId)
        .eq('status', 'completed')
        .gte('check_in', defaultPeriodStart)
        .lte('check_out', defaultPeriodEnd);

      if (!reservations || reservations.length === 0) {
        results.push({
          ownerId: currentOwnerId,
          status: 'skipped',
          reason: 'No completed reservations for this period'
        });
        continue;
      }

      let totalRevenue = 0;
      let totalCleaningFees = 0;
      let totalCleaningCosts = 0;
      let cleaningMarginTotal = 0;
      let totalCommission = 0;

      for (const res of reservations) {
        totalRevenue += Number(res.revenue_amount || 0);
        totalCleaningFees += Number(res.cleaning_fee || 0);
        totalCleaningCosts += Number(res.cleaning_cost || 0);
        cleaningMarginTotal += Number(res.cleaning_margin || 0);
        totalCommission += Number(res.commission_amount || 0);
      }

      const ownerNetAmount = totalRevenue - totalCommission;

      const { data: invoiceNumberData } = await supabase
        .rpc('generate_invoice_number_with_counter', { 
          admin_id: user.id,
          invoice_year: invoiceYear
        });

      const invoiceNumber = invoiceNumberData || `${invoiceYear}-0001`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const ownerNameSnapshot = ownerProfile.billing_full_name || 
        `${ownerProfile.first_name || ''} ${ownerProfile.last_name || ''}`.trim() ||
        'Non renseigné';
      const ownerEmailSnapshot = ownerProfile.billing_email || ownerProfile.email || '';

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          invoice_date: today.toISOString().split('T')[0],
          owner_id: currentOwnerId,
          admin_user_id: user.id,
          period_start: defaultPeriodStart,
          period_end: defaultPeriodEnd,
          total_revenue: totalRevenue,
          total_cleaning_fees: totalCleaningFees,
          total_cleaning_costs: totalCleaningCosts,
          cleaning_margin_total: cleaningMarginTotal,
          total_commission: totalCommission,
          owner_net_amount: ownerNetAmount,
          owner_name_snapshot: ownerNameSnapshot,
          owner_billing_address_snapshot: ownerProfile.billing_address || '',
          owner_billing_zip_snapshot: ownerProfile.billing_zip || '',
          owner_billing_city_snapshot: ownerProfile.billing_city || '',
          owner_billing_country_snapshot: ownerProfile.billing_country || 'France',
          owner_email_snapshot: ownerEmailSnapshot,
          status: 'draft',
          due_date: dueDate.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        results.push({
          ownerId: currentOwnerId,
          status: 'error',
          error: invoiceError.message
        });
        continue;
      }

      const invoiceItems = reservations.map(res => ({
        invoice_id: invoice.id,
        reservation_id: res.id,
        property_id: res.property_id,
        property_name: res.properties.name,
        check_in: res.check_in,
        check_out: res.check_out,
        guest_name: res.guest_name,
        revenue_amount: res.revenue_amount,
        cleaning_fee: res.cleaning_fee,
        cleaning_cost: res.cleaning_cost,
        cleaning_margin: res.cleaning_margin,
        commission_rate: res.properties.commission_rate,
        commission_amount: res.commission_amount
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        results.push({
          ownerId: currentOwnerId,
          invoiceId: invoice.id,
          status: 'error',
          error: `Invoice created but items failed: ${itemsError.message}`
        });
        continue;
      }

      results.push({
        ownerId: currentOwnerId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: 'created',
        reservationsCount: reservations.length,
        totalCommission,
        ownerNetAmount
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        period: { start: defaultPeriodStart, end: defaultPeriodEnd },
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});