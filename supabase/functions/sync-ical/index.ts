import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
  // Format: YYYYMMDD or YYYYMMDDTHHMMSSZ
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

    // Handle multi-line values
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.substring(1);
      continue;
    }

    // Process previous field if exists
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

    // Vérifier que l'utilisateur est admin
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

    // Vérifier que l'utilisateur est admin
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

    const { propertyId } = await req.json();

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: 'propertyId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les infos du logement
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, name, ical_url, ical_sync_enabled')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return new Response(
        JSON.stringify({ error: 'Logement non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!property.ical_url) {
      return new Response(
        JSON.stringify({ error: 'Aucune URL iCal configurée pour ce logement' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Télécharger le fichier iCal
    const icalResponse = await fetch(property.ical_url);
    if (!icalResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Impossible de télécharger le calendrier iCal' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const icalData = await icalResponse.text();
    const events = parseICalFile(icalData);

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Importer les événements
    for (const event of events) {
      const checkIn = parseICalDate(event.dtstart);
      const checkOut = parseICalDate(event.dtend);
      const guestName = event.summary || 'Réservation Airbnb';

      // Vérifier si la réservation existe déjà
      const { data: existing } = await supabase
        .from('reservations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('external_id', event.uid)
        .maybeSingle();

      if (existing) {
        // Mettre à jour
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
        // Vérifier s'il y a un conflit de dates
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

        // Créer nouvelle réservation
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

    // Mettre à jour la date de dernière synchro
    await supabase
      .from('properties')
      .update({ last_ical_sync: new Date().toISOString() })
      .eq('id', propertyId);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        skipped,
        total: events.length,
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