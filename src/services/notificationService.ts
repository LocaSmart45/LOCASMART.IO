import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'NEW_RESERVATION'
  | 'INTERVENTION_SCHEDULED'
  | 'INTERVENTION_REMINDER'
  | 'RESERVATION_MODIFIED'
  | 'RESERVATION_CANCELLED';

interface NotificationData {
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
}

interface SendNotificationParams {
  type: NotificationType;
  recipientId: string;
  reservationId?: string;
  interventionId?: string;
  data: NotificationData;
}

export async function sendNotification(params: SendNotificationParams) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session');
      return { success: false, error: 'No active session' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function notifyNewReservation(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  reservationId: string,
  guestName: string,
  checkIn: string,
  checkOut: string,
  amount: number,
  platform?: string
) {
  return sendNotification({
    type: 'NEW_RESERVATION',
    recipientId: ownerId,
    reservationId,
    data: {
      recipientEmail: ownerEmail,
      recipientName: ownerName,
      propertyName,
      guestName,
      checkIn,
      checkOut,
      amount,
      platform,
    },
  });
}

export async function notifyReservationModified(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  reservationId: string,
  guestName: string,
  checkIn: string,
  checkOut: string,
  amount: number
) {
  return sendNotification({
    type: 'RESERVATION_MODIFIED',
    recipientId: ownerId,
    reservationId,
    data: {
      recipientEmail: ownerEmail,
      recipientName: ownerName,
      propertyName,
      guestName,
      checkIn,
      checkOut,
      amount,
    },
  });
}

export async function notifyReservationCancelled(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  reservationId: string,
  guestName: string,
  checkIn: string,
  checkOut: string,
  amount: number
) {
  return sendNotification({
    type: 'RESERVATION_CANCELLED',
    recipientId: ownerId,
    reservationId,
    data: {
      recipientEmail: ownerEmail,
      recipientName: ownerName,
      propertyName,
      guestName,
      checkIn,
      checkOut,
      amount,
    },
  });
}

export async function notifyInterventionScheduled(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  interventionId: string,
  interventionType: string,
  scheduledDate: string
) {
  return sendNotification({
    type: 'INTERVENTION_SCHEDULED',
    recipientId: ownerId,
    interventionId,
    data: {
      recipientEmail: ownerEmail,
      recipientName: ownerName,
      propertyName,
      interventionType,
      scheduledDate,
    },
  });
}

export async function notifyInterventionReminder(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  propertyName: string,
  interventionId: string,
  interventionType: string,
  scheduledDate: string
) {
  return sendNotification({
    type: 'INTERVENTION_REMINDER',
    recipientId: ownerId,
    interventionId,
    data: {
      recipientEmail: ownerEmail,
      recipientName: ownerName,
      propertyName,
      interventionType,
      scheduledDate,
    },
  });
}
