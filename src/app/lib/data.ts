import { Event, Attendee, Raffle } from '@/app/lib/definitions';
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

export async function getEvents(): Promise<Event[]> {
  noStore();
  const query = supabase
    .from('events')
    .select('*, attendees(*)')
    .order('date', { ascending: false });
  return supabaseQuery(query);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  noStore();
  const query = supabase
    .from('events')
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
    .select('*, events(id, name, attendees(id, name, email))') // Fetch related event and attendees
    .order('created_at', { ascending: false });

  // Because Supabase returns the event object nested inside 'events',
  // we need to flatten the structure to match the Raffle type.
  const rafflesData = await supabaseQuery(query);
  return rafflesData.map((raffle: any) => ({
    ...raffle,
    eventName: raffle.events?.name,
  }));
}
