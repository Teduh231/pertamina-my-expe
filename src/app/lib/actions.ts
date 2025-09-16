'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Event, Product, Raffle, RaffleWinner, Transaction } from './definitions';
import { getEventById } from './data';
import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import { unstable_noStore as noStore } from 'next/cache';

export async function detectPiiInField(fieldName: string, fieldValue: string) {
  // This function still uses AI, but doesn't write to DB. Keeping it as is.
  if (!fieldValue || fieldValue.trim().length < 3) {
    return { mayContainPii: false };
  }
  try {
    const result = await detectPii({ fieldName, fieldValue });
    return result;
  } catch (error) {
    console.error('Error in PII detection flow:', error);
    // Be cautious and assume PII if AI fails
    return { mayContainPii: true };
  }
}

export async function exportAttendeesToCsv(eventId: string): Promise<string> {
    noStore();
    const event = await getEventById(eventId);

    if (!event) {
        throw new Error('Event not found');
    }
    
    const { data: attendees, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', eventId);

    if (error) {
        console.error('Supabase error fetching attendees:', error);
        throw new Error('Could not fetch attendees for CSV export.');
    }

    if (attendees.length === 0) {
        return "id,name,email,registered_at,custom_response\n";
    }

    const headers = Object.keys(attendees[0]);
    const csvRows = [headers.join(',')];

    for (const attendee of attendees) {
        const values = headers.map(header => {
            const value = attendee[header as keyof Attendee];
            // Handle values that might contain commas
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

export async function createOrUpdateEvent(eventData: Omit<Event, 'id' | 'attendees' | 'created_at'>, eventId?: string) {
  if (eventId) {
    // Update existing event
    const { error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId);
    
    if (error) {
      console.error('Supabase error updating event:', error);
      return { success: false, error: 'Database error: Could not update event.' };
    }
    revalidatePath(`/events/${eventId}`);
  } else {
    // Create new event
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select('id')
      .single();

    if (error) {
        console.error('Supabase error creating event:', error);
        return { success: false, error: 'Database error: Could not create event.' };
    }
    eventId = data.id;
  }

  revalidatePath('/events');
  revalidatePath('/dashboard');
  return { success: true, eventId };
}

export async function registerAttendee(eventId: string, attendeeData: Omit<Attendee, 'id' | 'registered_at'>) {
    const { error } = await supabase.from('attendees').insert([{ ...attendeeData, event_id: eventId }]);

    if (error) {
        console.error('Supabase error registering attendee:', error);
        // Handle specific errors, e.g., unique constraint violation for email per event
        if (error.code === '23505') { // unique_violation
            return { success: false, error: 'This email address has already been registered for this event.' };
        }
        return { success: false, error: 'Database error: Could not register attendee.' };
    }

    revalidatePath(`/events/${eventId}/register`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/attendees');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawn_at'>) {
    const { error } = await supabase.from('raffles').insert([raffleData]);
    if (error) {
        console.error('Supabase error creating raffle:', error);
        return { success: false, error: 'Database error: Could not create raffle.' };
    }
    revalidatePath('/raffle');
    revalidatePath('/prize-history');
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string) {
  noStore();
  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('*, events(id, name, attendees(id, name, email))')
    .eq('id', raffleId)
    .single();

  if (raffleError || !raffle) {
    console.error('Error fetching raffle:', raffleError);
    return { success: false, error: 'Could not find the specified raffle.' };
  }

  const drawnWinnerIds = raffle.winners?.map((w: RaffleWinner) => w.attendeeId) || [];
  const eligibleAttendees = raffle.events.attendees.filter(
    (attendee: Attendee) => !drawnWinnerIds.includes(attendee.id)
  );

  if (eligibleAttendees.length === 0) {
    await supabase.from('raffles').update({ status: 'finished' }).eq('id', raffleId);
    revalidatePath('/raffle');
    revalidatePath('/prize-history');
    return { success: true, message: 'No more eligible attendees to draw.' };
  }
  
  const winnerIndex = Math.floor(Math.random() * eligibleAttendees.length);
  const winner = eligibleAttendees[winnerIndex];

  const newWinner: RaffleWinner = {
    attendeeId: winner.id,
    name: winner.name,
    email: winner.email,
  };

  const updatedWinners = [...drawnWinnerIds.map(id => raffle.winners.find(w => w.attendeeId === id)), newWinner];

  const updatedRaffle: Partial<Raffle> = {
    winners: updatedWinners,
    status: updatedWinners.length >= raffle.number_of_winners ? 'finished' : 'active',
    drawn_at: updatedWinners.length >= raffle.number_of_winners ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabase
    .from('raffles')
    .update(updatedRaffle)
    .eq('id', raffleId);

  if (updateError) {
    console.error('Error updating raffle:', updateError);
    return { success: false, error: 'Could not save the winner.' };
  }
  
  revalidatePath('/raffle');
  revalidatePath('/prize-history');
  
  return { success: true, winner: newWinner };
}

export async function redeemProduct(productId: string, userId: string, productName: string, points: number) {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([{
          user_id: userId, // This would be the actual user's ID
          user_name: 'John Doe', // Placeholder, you'd fetch the user's name
          product_name: productName,
          points: points,
      }])
      .select()
      .single();

    if (error) {
        console.error('Supabase error creating transaction:', error);
        return { success: false, error: 'Database error: Could not redeem product.' };
    }

    const { error: stockError } = await supabase.rpc('decrement_product_stock', { p_id: productId });
    
    if (stockError) {
        console.error('Supabase error decrementing stock:', stockError);
        // Optionally, you could try to revert the transaction here
        return { success: false, error: 'Database error: Could not update stock.' };
    }

    revalidatePath('/pos');
    revalidatePath('/qr-scanner');

    return { success: true, transaction };
}
