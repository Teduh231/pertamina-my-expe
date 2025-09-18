import { Booth, Attendee, Raffle, Product, Transaction } from '@/app/lib/definitions';
import { supabase } from './supabase';
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
  const query = supabase
    .from('booths')
    .select('*, attendees(*)')
    .order('created_at', { ascending: false });
  return supabaseQuery(query);
}

export async function getBoothById(id: string): Promise<Booth | undefined> {
  noStore();
  const query = supabase
    .from('booths')
    .select('*, attendees(*)')
    .eq('id', id)
    .single();
  const data = await supabaseQuery(query);
  return data;
}

export async function getRaffles(): Promise<Raffle[]> {
  noStore();
  const query = supabase
    .from('raffles')
    .select('*, booths(id, name, attendees(id, name, email))') // Fetch related booth and attendees
    .order('created_at', { ascending: false });

  // Because Supabase returns the booth object nested inside 'booths',
  // we need to flatten the structure to match the Raffle type.
  const rafflesData = await supabaseQuery(query);
  return rafflesData.map((raffle: any) => ({
    ...raffle,
    boothName: raffle.booths?.name,
  }));
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
