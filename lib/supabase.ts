import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase config check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
});

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a mock client for development when Supabase is not configured
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.' } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
  }),
});

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : createMockClient() as any;

// Configuration status
export const getSupabaseConfig = () => ({
  isConfigured: isSupabaseConfigured,
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          country: string;
          flag: string | null;
          bank: string | null;
          account_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          country: string;
          flag?: string | null;
          bank?: string | null;
          account_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          country?: string;
          flag?: string | null;
          bank?: string | null;
          account_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transfers: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          recipient_user_id: string | null;
          recipient_name: string;
          amount: number;
          fee: number;
          source_currency: string;
          target_currency: string;
          exchange_rate: number;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          payment_method: string | null;
          transfer_time: string | null;
          institution_name: string | null;
          institution_id: string | null;
          scheduled_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          recipient_user_id?: string | null;
          recipient_name: string;
          amount: number;
          fee: number;
          source_currency?: string;
          target_currency: string;
          exchange_rate: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          payment_method?: string | null;
          transfer_time?: string | null;
          institution_name?: string | null;
          institution_id?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          recipient_user_id?: string | null;
          recipient_name?: string;
          amount?: number;
          fee?: number;
          source_currency?: string;
          target_currency?: string;
          exchange_rate?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          payment_method?: string | null;
          transfer_time?: string | null;
          institution_name?: string | null;
          institution_id?: string | null;
          scheduled_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exchange_rates: {
        Row: {
          id: string;
          source_currency: string;
          target_currency: string;
          rate: number;
          institution_name: string | null;
          institution_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_currency: string;
          target_currency: string;
          rate: number;
          institution_name?: string | null;
          institution_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_currency?: string;
          target_currency?: string;
          rate?: number;
          institution_name?: string | null;
          institution_id?: string | null;
          created_at?: string;
        };
      };
      balances: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      balance_transactions: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
          balance_before: number;
          balance_after: number;
          transaction_type: 'credit' | 'debit' | 'transfer_sent' | 'transfer_received' | 'fee' | 'refund' | 'initial';
          reference_id: string | null;
          description: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: string;
          amount: number;
          balance_before: number;
          balance_after: number;
          transaction_type: 'credit' | 'debit' | 'transfer_sent' | 'transfer_received' | 'fee' | 'refund' | 'initial';
          reference_id?: string | null;
          description?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          amount?: number;
          balance_before?: number;
          balance_after?: number;
          transaction_type?: 'credit' | 'debit' | 'transfer_sent' | 'transfer_received' | 'fee' | 'refund' | 'initial';
          reference_id?: string | null;
          description?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
    };
  };
}