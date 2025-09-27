
import { Event, Attendee, Raffle, Product, Transaction, UserProfile, CheckIn, Activity, ActivityParticipant, Staff } from '@/app/lib/definitions';
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


export async function getEvents(): Promise<Event[]> {
  noStore();
  const supabaseAdmin = createSupabaseServerClient();
  try {
    const query = supabaseAdmin
      .from('events')
      .select('*, check_ins(count)')
      .order('created_at', { ascending: false });
      
    const eventsData = await supabaseQuery(query);

    return eventsData.map((event: any) => ({
        ...event,
        attendees_count: event.check_ins[0]?.count || 0,
    }));

  } catch (error) {
     console.error("Failed to fetch events, returning empty array:", error);
     return [];
  }
}

export async function getEventById(id: string): Promise<Event | undefined> {
  noStore();
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
      
    if (eventError) throw eventError;

    const { data: checkInsData, error: checkInsError } = await supabaseAdmin
        .from('check_ins')
        .select('*')
        .eq('event_id', id);

    if (checkInsError) throw checkInsError;

    return { ...eventData, check_ins: checkInsData } as Event;

  } catch (error: any) {
    console.error(`Failed to fetch event ${id}, returning undefined:`, error.message);
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

export async function getAttendeesByName(name: string): Promise<Attendee[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const query = supabaseAdmin.from('attendees').select('*').ilike('name', `%${name}%`);
        return await supabaseQuery(query);
    } catch (error) {
        console.error(`Failed to fetch attendees by name, returning empty array:`, error);
        return [];
    }
}


export async function getRaffles(eventId?: string): Promise<Raffle[]> {
    noStore();
    const supabaseAdmin = createSupabaseServerClient();
    try {
      let query = supabaseAdmin
        .from('raffles')
        .select('*, events(id, name)')
        .order('created_at', { ascending: false });
    
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
    
      const rafflesData = await supabaseQuery(query);
      return rafflesData.map((raffle: any) => ({
        ...raffle,
        eventName: raffle.events?.name,
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

export async function getProductById(id: string): Promise<Product | null> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const query = supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
        return await supabaseQuery(query);
    } catch (error) {
        console.error(`Failed to fetch product ${id}, returning null:`, error);
        return null;
    }
}


export async function getProductsByEvent(eventId: string): Promise<Product[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const query = supabaseAdmin.from('products').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
      return await supabaseQuery(query);
    } catch (error) {
      console.error("Failed to fetch products for event, returning empty array:", error);
      return [];
    }
}

export async function getActivitiesByEvent(eventId: string): Promise<Activity[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const { data, error } = await supabaseAdmin
        .from('activities')
        .select('*, activity_participants(count)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
          throw error;
      }
      
      return data.map((activity: any) => ({
        ...activity,
        participant_count: activity.activity_participants[0]?.count || 0,
      }));

    } catch (error) {
      console.error("Failed to fetch activities for event, returning empty array:", error);
      return [];
    }
}

export async function getActivityById(activityId: string): Promise<Activity | null> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const query = supabaseAdmin.from('activities').select('*').eq('id', activityId).maybeSingle();
      return await supabaseQuery(query);
    } catch (error) {
      console.error(`Failed to fetch activity ${activityId}, returning null:`, error);
      return null;
    }
}

export async function getActivityParticipants(activityId: string): Promise<ActivityParticipant[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
      const query = supabaseAdmin
        .from('activity_participants')
        .select('*, attendees(name, phone_number)')
        .eq('activity_id', activityId)
        .order('completed_at', { ascending: false });
      return await supabaseQuery(query);
    } catch (error) {
      console.error(`Failed to fetch participants for activity ${activityId}, returning empty array:`, error);
      return [];
    }
}

export async function getRecentTransactions(eventId: string, limit = 5): Promise<Transaction[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const query = supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return await supabaseQuery(query);
    } catch (error) {
        console.error("Failed to fetch transactions, returning empty array:", error);
        return [];
    }
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const query = supabaseAdmin
            .from('transactions')
            .select('*, attendees(*)')
            .eq('id', transactionId)
            .single();
        const data = await supabaseQuery(query);
        // Manually format because Supabase doesn't nest this deep easily with RLS
        return data ? { ...data, attendee: data.attendees } : null;
    } catch (error) {
        console.error(`Failed to fetch transaction ${transactionId}, returning null:`, error);
        return null;
    }
}

export async function getStaff(): Promise<Staff[]> {
    noStore();
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    try {
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        const { data: roles, error: rolesError } = await supabaseAdmin.from('user_roles').select('*');
        if (rolesError) throw rolesError;
        
        const staffUsers = users.users
            .filter(user => user.user_metadata?.role === 'staff')
            .map(user => {
                const roleInfo = roles.find(r => r.id === user.id);
                return {
                    id: user.id,
                    name: user.user_metadata?.full_name || user.email, // Fallback name
                    email: user.email,
                    event_id: roleInfo?.event_id || null,
                };
            });
            
        // Fetch event names for assigned staff
        const eventIds = staffUsers.map(s => s.event_id).filter(Boolean) as string[];
        if (eventIds.length > 0) {
            const { data: events, error: eventsError } = await supabaseAdmin.from('events').select('id, name').in('id', eventIds);
            if (eventsError) throw eventsError;

            return staffUsers.map(staff => {
                const assignedEvent = events.find(e => e.id === staff.event_id);
                return {
                    ...staff,
                    assignedEventName: assignedEvent?.name,
                };
            });
        }
        
        return staffUsers;

    } catch (error) {
        console.error("Failed to fetch staff, returning empty array:", error);
        return [];
    }
}
