import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const startedAt = new Date().toISOString();
  let logId: string | null = null;

  try {
    console.log("⏱️ Starting scheduled iCal synchronization...");

    const { data: logData, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        started_at: startedAt,
        status: 'RUNNING',
        properties_synced: 0,
        reservations_created: 0,
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    } else {
      logId = logData?.id;
      console.log("✅ Sync log created:", logId);
    }

    const syncAllUrl = `${supabaseUrl}/functions/v1/sync-all-ical`;
    console.log("🔄 Calling sync-all-ical function...");

    const syncResponse = await fetch(syncAllUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      throw new Error(`Sync failed: ${syncResponse.status} - ${errorText}`);
    }

    const syncResult = await syncResponse.json();
    console.log("✅ Sync completed:", syncResult);

    const totalReservationsCreated = syncResult.results?.reduce(
      (sum: number, r: any) => sum + (r.imported || 0),
      0
    ) || 0;

    const finishedAt = new Date().toISOString();

    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          finished_at: finishedAt,
          status: 'COMPLETED',
          properties_synced: syncResult.synced || 0,
          reservations_created: totalReservationsCreated,
          errors: syncResult.results
            ?.filter((r: any) => !r.success)
            .map((r: any) => ({
              property_id: r.propertyId,
              property_name: r.propertyName,
              error: r.error,
            })) || null,
        })
        .eq('id', logId);

      console.log("✅ Sync log updated");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled sync completed successfully',
        log_id: logId,
        started_at: startedAt,
        finished_at: finishedAt,
        properties_synced: syncResult.synced || 0,
        reservations_created: totalReservationsCreated,
        results: syncResult.results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("❌ Sync error:", error);

    const finishedAt = new Date().toISOString();

    if (logId) {
      await supabase
        .from('sync_logs')
        .update({
          finished_at: finishedAt,
          status: 'FAILED',
          errors: [{
            error: error instanceof Error ? error.message : String(error),
          }],
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        log_id: logId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});