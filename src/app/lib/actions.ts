'use server';

import { detectPii } from '@/ai/flows/pii-detection-for-registration';
import { Attendee, Event } from './definitions';
import { getEventById } from './data';

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
