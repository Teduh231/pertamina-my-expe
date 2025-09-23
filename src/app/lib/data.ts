import { Booth, Attendee, Raffle, Product, Transaction, Tenant, UserProfile, CheckIn } from '@/app/lib/definitions';
import { supabase } from './supabase/client';
import { unstable_noStore as noStore } from 'next/cache';

// Helper function to handle Supabase queries and errors
async function supabaseQuery(query: any) {
  const { data, error } = await query;
  if (error) {
    console.error('Supabase query error:', error.message);
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return data;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    noStore();
    try {
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', userId)
            .single();

        if (roleError && roleError.code !== 'PGRST116') {
             console.error('Error fetching user role:', roleError?.message);
             return null;
        }

        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('booth_id')
            .eq('id', userId)
            .single();
        
        if (tenantError && tenantError.code !== 'PGRST116') {
             console.error('Error fetching tenant info:', tenantError?.message);
        }

        return {
            role: roleData?.role || 'tenant',
            booth_id: tenantData?.booth_id || null,
        };
    } catch (error) {
        console.error("Failed to fetch user profile, returning null:", error);
        return null;
    }
}


export async function getBooths(): Promise<Booth[]> {
  noStore();
  try {
    // We now count check-ins instead of attendees directly linked to a booth.
    const query = supabase
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
  try {
    // Fetch booth and its associated check-ins with attendee details
    const query = supabase
      .from('booths')
      .select('*, raffles(*), check_ins(*, attendees(id, name, email))')
      .eq('id', id)
      .single();
    return await supabaseQuery(query);
  } catch (error) {
    console.error(`Failed to fetch booth ${id}, returning undefined:`, error);
    return undefined;
  }
}

export async function getAttendees(): Promise<Attendee[]> {
  noStore();
  try {
    const query = supabase
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
    try {
        const query = supabase.from('attendees').select('*').eq('id', id).maybeSingle();
        return await supabaseQuery(query);
    } catch (error) {
        console.error(`Failed to fetch attendee ${id}, returning null:`, error);
        return null;
    }
}


export async function getRaffles(boothId?: string): Promise<Raffle[]> {
    noStore();
    try {
      let query = supabase
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
    try {
      const query = supabase.from('products').select('*').order('points', { ascending: true });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch products, returning empty array:", error);
      return [];
    }
}

export async function getProductsByBooth(boothId: string): Promise<Product[]> {
    noStore();
    try {
      const query = supabase.from('products').select('*').eq('booth_id', boothId).order('created_at', { ascending: false });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch products, returning empty array:", error);
      return [];
    }
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
    noStore();
    try {
        const query = supabase
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
    try {
        const query = supabase
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
