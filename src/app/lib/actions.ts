'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Event, Raffle, RaffleWinner } from './definitions';
import { getEventById, getEvents } from './data';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function detectPiiInField(fieldName: string, fieldValue: string) {
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
  try {
    if (eventId) {
      // Update existing event
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, eventData);
      revalidatePath(`/events/${eventId}`);
      revalidatePath('/events');
      revalidatePath('/dashboard');
      return { success: true, eventId };
    } else {
      // Create new event
      const docRef = await addDoc(collection(db, 'events'), eventData);
      revalidatePath('/events');
      revalidatePath('/dashboard');
      return { success: true, eventId: docRef.id };
    }
  } catch (error) {
    console.error("Error saving event: ", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function registerAttendee(eventId: string, attendeeData: Omit<Attendee, 'id' | 'registeredAt'>) {
    try {
        const eventRef = doc(db, 'events', eventId);
        const attendeesCollectionRef = collection(eventRef, 'attendees');

        const newAttendee = {
            ...attendeeData,
            registeredAt: new Date().toISOString()
        }

        await addDoc(attendeesCollectionRef, newAttendee);

        revalidatePath(`/events/${eventId}/register`);
        revalidatePath(`/events/${eventId}`);

        return { success: true };
    } catch (error) {
        console.error("Error registering attendee: ", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function createRaffle(raffleData: Omit<Raffle, 'id' | 'status' | 'winners' | 'drawnAt'>) {
    try {
        const newRaffle: Omit<Raffle, 'id'> = {
            ...raffleData,
            status: 'active',
            winners: [],
            drawnAt: null,
        }
        await addDoc(collection(db, 'raffles'), newRaffle);
        revalidatePath('/raffle');
        return { success: true };
    } catch (error) {
        console.error("Error creating raffle: ", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function drawRaffleWinner(raffleId: string) {
    try {
        const raffleRef = doc(db, 'raffles', raffleId);
        const raffleDoc = await getDoc(raffleRef);
        if (!raffleDoc.exists()) {
            throw new Error("Raffle not found");
        }
        const raffle = { id: raffleDoc.id, ...raffleDoc.data() } as Raffle;

        if (raffle.status !== 'active') {
            throw new Error("Raffle is not active");
        }

        const event = await getEventById(raffle.eventId);
        if (!event) {
            throw new Error("Event not found");
        }

        const eligibleAttendees = event.attendees.filter(
            attendee => !raffle.winners.some(winner => winner.attendeeId === attendee.id)
        );

        if (eligibleAttendees.length === 0) {
            await updateDoc(raffleRef, { status: 'finished' });
            revalidatePath('/raffle');
            return { success: true, message: 'No more eligible attendees to draw.' };
        }

        const winnerIndex = Math.floor(Math.random() * eligibleAttendees.length);
        const winner = eligibleAttendees[winnerIndex];

        const newWinner: RaffleWinner = {
            attendeeId: winner.id,
            name: winner.name,
            email: winner.email,
        };

        const updatedWinners = [...raffle.winners, newWinner];
        const newStatus = updatedWinners.length >= raffle.numberOfWinners ? 'finished' : 'active';

        await updateDoc(raffleRef, {
            winners: updatedWinners,
            status: newStatus,
            drawnAt: newStatus === 'finished' ? new Date().toISOString() : null
        });

        revalidatePath('/raffle');
        return { success: true, winner };

    } catch (error) {
        console.error("Error drawing winner:", error);
        return { success: false, error: (error as Error).message };
    }
}
