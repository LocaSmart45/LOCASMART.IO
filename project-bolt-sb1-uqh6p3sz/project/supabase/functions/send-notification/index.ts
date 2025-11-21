import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  type: 'NEW_RESERVATION' | 'INTERVENTION_SCHEDULED' | 'INTERVENTION_REMINDER' | 'RESERVATION_MODIFIED' | 'RESERVATION_CANCELLED';
  recipientId: string;
  reservationId?: string;
  interventionId?: string;
  data: {
    recipientEmail: string;
    recipientName: string;
    propertyName?: string;
    checkIn?: string;
    checkOut?: string;
    guestName?: string;
    amount?: number;
    interventionType?: string;
    scheduledDate?: string;
    platform?: string;
  };
}

function generateEmailContent(payload: NotificationPayload): { subject: string; body: string } {
  const { type, data } = payload;

  switch (type) {
    case 'NEW_RESERVATION':
      return {
        subject: `Nouvelle réservation - ${data.propertyName}`,
        body: `Bonjour ${data.recipientName},

Une nouvelle réservation a été créée pour votre logement "${data.propertyName}".

Détails de la réservation :
- Voyageur : ${data.guestName}
- Arrivée : ${data.checkIn}
- Départ : ${data.checkOut}
- Montant : ${data.amount}€
- Plateforme : ${data.platform || 'Manuel'}

Connectez-vous à votre tableau de bord pour plus de détails.

Cordialement,
L'équipe LocaSmart`,
      };

    case 'RESERVATION_MODIFIED':
      return {
        subject: `Réservation modifiée - ${data.propertyName}`,
        body: `Bonjour ${data.recipientName},

Une réservation a été modifiée pour votre logement "${data.propertyName}".

Nouvelles informations :
- Voyageur : ${data.guestName}
- Arrivée : ${data.checkIn}
- Départ : ${data.checkOut}
- Montant : ${data.amount}€

Connectez-vous à votre tableau de bord pour voir tous les détails.

Cordialement,
L'équipe LocaSmart`,
      };

    case 'RESERVATION_CANCELLED':
      return {
        subject: `Réservation annulée - ${data.propertyName}`,
        body: `Bonjour ${data.recipientName},

Une réservation a été annulée pour votre logement "${data.propertyName}".

Détails :
- Voyageur : ${data.guestName}
- Dates : Du ${data.checkIn} au ${data.checkOut}
- Montant : ${data.amount}€

Connectez-vous à votre tableau de bord pour plus d'informations.

Cordialement,
L'équipe LocaSmart`,
      };

    case 'INTERVENTION_SCHEDULED':
      return {
        subject: `Intervention planifiée - ${data.propertyName}`,
        body: `Bonjour ${data.recipientName},

Une intervention a été planifiée pour votre logement "${data.propertyName}".

Détails :
- Type : ${data.interventionType}
- Date : ${data.scheduledDate}

Connectez-vous à votre tableau de bord pour plus de détails.

Cordialement,
L'équipe LocaSmart`,
      };

    case 'INTERVENTION_REMINDER':
      return {
        subject: `Rappel : Intervention demain - ${data.propertyName}`,
        body: `Bonjour ${data.recipientName},

Rappel : Une intervention est prévue demain pour votre logement "${data.propertyName}".

Détails :
- Type : ${data.interventionType}
- Date : ${data.scheduledDate}

Assurez-vous que tout est prêt.

Cordialement,
L'équipe LocaSmart`,
      };

    default:
      return {
        subject: 'Notification LocaSmart',
        body: `Bonjour ${data.recipientName},\n\nVous avez une nouvelle notification.\n\nCordialement,\nL'équipe LocaSmart`,
      };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();

    const { subject, body } = generateEmailContent(payload);

    console.log(`Sending email to ${payload.data.recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    let emailStatus = 'SENT';
    let emailError = null;

    try {
      // NOTE: Pour l'instant, on simule l'envoi d'email
      // Dans un environnement de production, vous devriez intégrer un service comme:
      // - Resend (https://resend.com/)
      // - SendGrid
      // - AWS SES
      // - Postmark
      
      // Exemple avec Resend (à décommenter et configurer):
      // const resendApiKey = Deno.env.get("RESEND_API_KEY");
      // const resendResponse = await fetch("https://api.resend.com/emails", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${resendApiKey}`,
      //   },
      //   body: JSON.stringify({
      //     from: "LocaSmart <noreply@locasmart.com>",
      //     to: [payload.data.recipientEmail],
      //     subject: subject,
      //     text: body,
      //   }),
      // });
      //
      // if (!resendResponse.ok) {
      //   throw new Error(`Resend API error: ${await resendResponse.text()}`);
      // }

      console.log("✅ Email sent successfully (simulated)");
    } catch (emailErr) {
      console.error("❌ Failed to send email:", emailErr);
      emailStatus = 'FAILED';
      emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
    }

    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        type: payload.type,
        recipient_id: payload.recipientId,
        reservation_id: payload.reservationId || null,
        intervention_id: payload.interventionId || null,
        status: emailStatus,
        error: emailError,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log notification:", logError);
    }

    return new Response(
      JSON.stringify({
        success: emailStatus === 'SENT',
        message: emailStatus === 'SENT' ? 'Notification sent successfully' : 'Failed to send notification',
        error: emailError,
      }),
      {
        status: emailStatus === 'SENT' ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});