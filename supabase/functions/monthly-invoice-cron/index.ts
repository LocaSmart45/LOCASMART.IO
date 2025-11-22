import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    console.log('Starting monthly invoice generation cron...');

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    console.log(`Period: ${periodStart} to ${periodEnd}`);

    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      console.log('No admins found');
      return new Response(
        JSON.stringify({ success: true, message: 'No admins found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allResults = [];

    for (const admin of admins) {
      console.log(`Processing admin: ${admin.email}`);

      const { data: properties } = await supabase
        .from('properties')
        .select('owner_id, profiles!inner(id, first_name, last_name, email)')
        .eq('admin_user_id', admin.id);

      if (!properties || properties.length === 0) {
        console.log(`No properties for admin ${admin.email}`);
        continue;
      }

      const uniqueOwners = Array.from(
        new Map(properties.map(p => [p.owner_id, p])).values()
      );

      for (const ownerProp of uniqueOwners) {
        const currentOwnerId = ownerProp.owner_id;

        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('owner_id', currentOwnerId)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .maybeSingle();

        if (existingInvoice) {
          console.log(`Invoice already exists for owner ${currentOwnerId}`);
          allResults.push({
            adminId: admin.id,
            ownerId: currentOwnerId,
            status: 'skipped',
            reason: 'Invoice already exists'
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
          .gte('check_in', periodStart)
          .lte('check_out', periodEnd);

        if (!reservations || reservations.length === 0) {
          console.log(`No completed reservations for owner ${currentOwnerId}`);
          allResults.push({
            adminId: admin.id,
            ownerId: currentOwnerId,
            status: 'skipped',
            reason: 'No completed reservations'
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
          .rpc('generate_invoice_number', { admin_id: admin.id });

        const invoiceNumber = invoiceNumberData || `FAC-${new Date().getFullYear()}-${Date.now()}`;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            owner_id: currentOwnerId,
            admin_user_id: admin.id,
            period_start: periodStart,
            period_end: periodEnd,
            total_revenue: totalRevenue,
            total_cleaning_fees: totalCleaningFees,
            total_cleaning_costs: totalCleaningCosts,
            cleaning_margin_total: cleaningMarginTotal,
            total_commission: totalCommission,
            owner_net_amount: ownerNetAmount,
            status: 'draft',
            due_date: dueDate.toISOString().split('T')[0]
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`Error creating invoice for owner ${currentOwnerId}:`, invoiceError);
          allResults.push({
            adminId: admin.id,
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
          console.error(`Error creating invoice items for invoice ${invoice.id}:`, itemsError);
          allResults.push({
            adminId: admin.id,
            ownerId: currentOwnerId,
            invoiceId: invoice.id,
            status: 'error',
            error: `Invoice created but items failed: ${itemsError.message}`
          });
          continue;
        }

        console.log(`Invoice created successfully: ${invoice.invoice_number}`);
        allResults.push({
          adminId: admin.id,
          ownerId: currentOwnerId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          status: 'created',
          reservationsCount: reservations.length,
          totalCommission,
          ownerNetAmount
        });

        const { data: subscription } = await supabase
          .from('subscription_plans')
          .select('notifications_enabled')
          .eq('admin_user_id', admin.id)
          .maybeSingle();

        if (subscription?.notifications_enabled) {
          console.log(`Notifications enabled for admin ${admin.email}, would send email`);
        }
      }
    }

    const created = allResults.filter(r => r.status === 'created').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;
    const errors = allResults.filter(r => r.status === 'error').length;

    console.log(`Cron completed: ${created} created, ${skipped} skipped, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        period: { start: periodStart, end: periodEnd },
        summary: { created, skipped, errors },
        results: allResults
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Cron error:', error);
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