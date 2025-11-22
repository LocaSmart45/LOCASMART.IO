import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description?: string;
}

function parseICalDate(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function parseICalFile(icalData: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalData.split('\n').map(line => line.trim());
  
  let currentEvent: Partial<ICalEvent> | null = null;
  let currentField = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.substring(1);
      continue;
    }

    if (currentField && currentEvent) {
      if (currentField === 'UID') currentEvent.uid = currentValue;
      else if (currentField === 'SUMMARY') currentEvent.summary = currentValue;
      else if (currentField === 'DTSTART') currentEvent.dtstart = currentValue;
      else if (currentField === 'DTEND') currentEvent.dtend = currentValue;
      else if (currentField === 'DESCRIPTION') currentEvent.description = currentValue;
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.uid && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      currentField = line.substring(0, colonIndex).split(';')[0];
      currentValue = line.substring(colonIndex + 1);
    }
  }

  return events;
}

async function syncProperty(supabase: any, propertyId: string, icalUrl: string) {
  try {
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      return { success: false, error: 'Impossible de télécharger le calendrier iCal' };
    }

    const icalData = await icalResponse.text();
    const events = parseICalFile(icalData);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      const checkIn = parseICalDate(event.dtstart);
      const checkOut = parseICalDate(event.dtend);
      const guestName = event.summary || 'Réservation Airbnb';

      const { data: existing } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('external_id', event.uid)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reservations')
          .update({
            check_in: checkIn,
            check_out: checkOut,
            guest_name: guestName,
            source: 'ical',
          })
          .eq('id', existing.id);
        updated++;
      } else {
        const { data: conflict } = await supabase
          .from('reservations')
          .select('id')
          .eq('property_id', propertyId)
          .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)
          .maybeSingle();

        if (conflict) {
          skipped++;
          continue;
        }

        await supabase
          .from('reservations')
          .insert({
            property_id: propertyId,
            guest_name: guestName,
            check_in: checkIn,
            check_out: checkOut,
            status: 'confirmed',
            source: 'ical',
            external_id: event.uid,
          });
        imported++;
      }
    }

    await supabase
      .from('properties')
      .update({ last_ical_sync: new Date().toISOString() })
      .eq('id', propertyId);

    return { success: true, imported, updated, skipped, total: events.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
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

    // Récupérer tous les logements avec synchro iCal activée
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('id, name, ical_url')
      .eq('ical_sync_enabled', true)
      .not('ical_url', 'is', null);

    if (propsError) {
      throw new Error(`Erreur récupération logements: ${propsError.message}`);
    }

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucun logement à synchroniser', synced: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const results = [];
    for (const property of properties) {
      const result = await syncProperty(supabase, property.id, property.ical_url);
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        ...result,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: results.length,
        results,
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