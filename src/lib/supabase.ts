import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'owner';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  airbnb_url?: string;
  booking_url?: string;
  commission_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  platform: 'airbnb' | 'booking' | 'direct';
  total_amount: number;
  commission_amount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: string;
  property_id: string;
  reservation_id?: string;
  type: 'cleaning' | 'maintenance' | 'check_in' | 'check_out';
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  cost?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id?: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}
