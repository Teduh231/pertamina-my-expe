import { Booth, Attendee, Raffle, Product, Transaction, Tenant, UserProfile, CheckIn, Activity } from '@/app/lib/definitions';
import { supabase } from './supabase/client';
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// This is a special instance of the Supabase client for use in server components
// where we might not have access to the service role key, but can use the user's session.
const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // This case should ideally not be hit if env vars are set correctly.
        console.error("Missing Supabase URL or Anon Key for server client");
        // Fallback to the regular client-side client
        return supabase;
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper function to handle Supabase queries and errors
async function supabaseQuery(query: any) {
  const { data, error } = await query;
  if (error) {
    console.error('Supabase query error:', error.message);
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return data;
}


export async function getBooths(): Promise<Booth[]> {
  noStore();
  const supabaseAdmin = createSupabaseServerClient();
  try {
    // We now count check-ins instead of attendees directly linked to a booth.
    const query = supabaseAdmin
      .from('booths')
      .select('*, check_ins(count)')
      .order('created_at', { ascending: false });
      
    const boothsData = await supabaseQuery(query);

    return boothsData.map((booth: any) => ({
        ...booth,
        attendees_count: booth.check_ins[0]?.count || 0,
    }));

  } catch (error) {
     console.error("Failed to fetch booths, returning empty array:", error);
     return [];
  }
}

export async function getBoothById(id: string): Promise<Booth | undefined> {
  noStore();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    const { data, error } = await supabaseAdmin
      .from('booths')
      .select(`
        *,
        check_ins (
          attendee_id,
          checked_in_at,
          attendees (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', id)
      .single();
      
      if (error) throw error;

    return data as Booth;
  } catch (error) {
    console.error(`Failed to fetch booth ${id}, returning undefined:`, error);
    return undefined;
  }
}

export async function getAttendees(): Promise<Attendee[]> {
  noStore();
  const supabaseAdmin = createSupabaseServerClient();
  try {
    const query = supabaseAdmin
      .from('attendees')
      .select('*')
      .order('registered_at', { ascending: false });
    return await supabaseQuery(query);
  } catch (error) {
    console.error("Failed to fetch attendees, returning empty array:", error);
    return [];
  }
}

export async function getAttendeeById(id: string): Promise<Attendee | null> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const query = supabaseAdmin.from('attendees').select('*').eq('id', id).maybeSingle();
        return await supabaseQuery(query);
    } catch (error) {
        console.error(`Failed to fetch attendee ${id}, returning null:`, error);
        return null;
    }
}


export async function getRaffles(boothId?: string): Promise<Raffle[]> {
    noStore();
    const supabaseAdmin = createSupabaseServerClient();
    try {
      let query = supabaseAdmin
        .from('raffles')
        .select('*, booths(id, name)')
        .order('created_at', { ascending: false });
    
      if (boothId) {
        query = query.eq('booth_id', boothId);
      }
    
      const rafflesData = await supabaseQuery(query);
      return rafflesData.map((raffle: any) => ({
        ...raffle,
        boothName: raffle.booths?.name,
      }));
    } catch (error) {
      console.error("Failed to fetch raffles, returning empty array:", error);
      return [];
    }
}
  

export async function getProducts(): Promise<Product[]> {
    noStore();
    const supabaseAdmin = createSupabaseServerClient();
    try {
      const query = supabaseAdmin.from('products').select('*').order('points', { ascending: true });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch products, returning empty array:", error);
      return [];
    }
}

export async function getProductsByBooth(boothId: string): Promise<Product[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const query = supabaseAdmin.from('products').select('*').eq('booth_id', boothId).order('created_at', { ascending: false });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch products for booth, returning empty array:", error);
      return [];
    }
}

export async function getActivitiesByBooth(boothId: string): Promise<Activity[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const query = supabaseAdmin.from('activities').select('*').eq('booth_id', boothId).order('created_at', { ascending: false });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch activities for booth, returning empty array:", error);
      return [];
    }
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
    noStore();
    const supabaseAdmin = createSupabaseServerClient();
    try {
        const query = supabaseAdmin
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return await supabaseQuery(query);
    } catch (error) {
        console.error("Failed to fetch transactions, returning empty array:", error);
        return [];
    }
}

export async function getTenants(): Promise<Tenant[]> {
    noStore();
    const supabaseAdmin = createSupabaseServerClient();
    try {
        const query = supabaseAdmin
        .from('tenants')
        .select('*, booths(id, name)');
        
        const tenantsData = await supabaseQuery(query);
        return tenantsData.map((tenant: any) => ({
            ...tenant,
            boothName: tenant.booths?.name,
        }));
    } catch (error) {
         console.error("Failed to fetch tenants, returning empty array:", error);
         return [];
    }
}
