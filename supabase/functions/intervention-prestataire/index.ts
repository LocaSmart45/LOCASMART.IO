// supabase/functions/intervention-prestataire/index.ts

import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  if (req.method === "GET") {
    // Récupérer l'intervention liée au token
    const { data, error } = await supabase
      .from("interventions")
      .select("*")
      .eq("prestataire_token", token)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { checklist, photos, note, markDone } = body as {
      checklist?: any;
      photos?: string[];
      note?: string;
      markDone?: boolean;
    };

    const updateFields: Record<string, any> = {
      prestataire_checklist: checklist ?? [],
      prestataire_photos: photos ?? [],
      prestataire_notes: note ?? "",
    };

    if (markDone) {
      // dans ta table, la colonne s'appelle "statut"
      updateFields.statut = "terminee";
    }

    const { error } = await supabase
      .from("interventions")
      .update(updateFields)
      .eq("prestataire_token", token);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: { "Content-Type": "text/plain" },
  });
});
