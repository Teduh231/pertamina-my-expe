import { Booth, Attendee, Raffle, Product, Transaction, Tenant } from '@/app/lib/definitions';
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

export async function getBooths(): Promise<Booth[]> {
  noStore();
  try {
    const query = supabase
      .from('booths')
      .select('*, attendees(*)')
      .order('created_at', { ascending: false });
    return await supabaseQuery(query);
  } catch (error) {
     console.error("Failed to fetch booths, returning empty array:", error);
     return [];
  }
}

export async function getBoothById(id: string): Promise<Booth | undefined> {
  noStore();
  try {
    const query = supabase
      .from('booths')
      .select('*, attendees(*), raffles(*)')
      .eq('id', id)
      .single();
    return await supabaseQuery(query);
  } catch (error) {
    console.error(`Failed to fetch booth ${id}, returning undefined:`, error);
    return undefined;
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
