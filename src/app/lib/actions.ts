'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Event, Raffle, RaffleWinner } from './definitions';
import { getEventById, getEvents } from './data';
import { revalidatePath } from 'next/cache';

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
    const event = await getEventById(eventId);

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.attendees.length === 0) {
        return "id,name,email,registeredAt,customResponse\n";
    }

    const headers = Object.keys(event.attendees[0]);
    const csvRows = [headers.join(',')];

    for (const attendee of event.attendees) {
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

export async function createOrUpdateEvent(eventData: Omit<Event, 'id' | 'attendees'>, eventId?: string) {
  console.log("Static mode: Pretending to save event.");
  if (eventId) {
    // In a real app, you would update the static mock data store here
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    revalidatePath('/dashboard');
    return { success: true, eventId };
  } else {
    const newId = `evt-${Date.now()}`;
    // In a real app, you would add to the static mock data store here
    revalidatePath('/events');
    revalidatePath('/dashboard');
    return { success: true, eventId: newId };
  }
}

export async function registerAttendee(eventId: string, attendeeData: Omit<Attendee, 'id' | 'registeredAt'>) {
    console.log("Static mode: Pretending to register attendee.");
    // In a real app, you would add to the static mock data store here
    revalidatePath(`/events/${eventId}/register`);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
}

export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawnAt'>) {
    console.log("Static mode: Pretending to create raffle.");
    revalidatePath('/raffle');
    return { success: true };
}

export async function drawRaffleWinner(raffleId: string) {
    console.log("Static mode: Pretending to draw winner.");
    
    // This is a simplified static logic. In a real scenario, this would be more complex.
    const winner = {
        id: 'temp-winner-id',
        name: 'Static Winner',
        email: 'winner@example.com',
        registeredAt: new Date().toISOString()
    }
    
    revalidatePath('/raffle');
    return { success: true, winner };
}
