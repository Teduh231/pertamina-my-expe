import { Event, Attendee } from '@/app/lib/definitions';
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, collectionGroup, query } from 'firebase/firestore';
import { subDays, format } from 'date-fns';

const today = new Date();

export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Tech Innovators Conference 2024',
    date: format(new Date().setDate(today.getDate() + 30), 'yyyy-MM-dd'),
    time: '09:00',
    location: 'Silicon Valley Convention Center',
    description: 'Join the brightest minds in tech for a day of innovation, networking, and groundbreaking announcements. Discover the future of AI, blockchain, and more.',
    speaker: 'Dr. Evelyn Reed',
    status: 'published',
    attendees: [
      { id: 'a1', name: 'Alice Johnson', email: 'alice@example.com', registeredAt: format(subDays(today, 5), 'yyyy-MM-dd') },
      { id: 'a2', name: 'Bob Williams', email: 'bob@example.com', registeredAt: format(subDays(today, 10), 'yyyy-MM-dd') },
      { id: 'a3', name: 'Charlie Brown', email: 'charlie@example.com', registeredAt: format(subDays(today, 2), 'yyyy-MM-dd') },
    ],
  },
  {
    id: '2',
    name: 'Creative Design Workshop',
    date: format(new Date().setDate(today.getDate() + 15), 'yyyy-MM-dd'),
    time: '13:00',
    location: 'The Art Space, New York',
    description: 'A hands-on workshop for designers looking to push their creative boundaries. Learn new techniques in UI/UX and brand identity from industry leaders.',
    speaker: 'Marco Bianci',
    status: 'published',
    attendees: [
      { id: 'b1', name: 'Diana Prince', email: 'diana@example.com', registeredAt: format(subDays(today, 12), 'yyyy-MM-dd') },
      { id: 'b2', name: 'Edward Nygma', email: 'edward@example.com', registeredAt: format(subDays(today, 3), 'yyyy-MM-dd') },
    ],
  },
  {
    id: '3',
    name: 'Indie Music Fest',
    date: format(new Date().setDate(today.getDate() - 2), 'yyyy-MM-dd'),
    time: '18:00',
    location: 'Greenfield Park',
    description: 'Experience a magical evening with performances from the best up-and-coming indie bands. Food trucks, art installations, and great vibes.',
    speaker: 'Various Artists',
    status: 'published',
    attendees: Array.from({ length: 150 }, (_, i) => ({
      id: `c${i}`,
      name: `Attendee ${i + 1}`,
      email: `attendee${i + 1}@musicfest.com`,
      registeredAt: format(subDays(today, Math.floor(Math.random() * 30) + 1), 'yyyy-MM-dd'),
    })),
  },
  {
    id: '4',
    name: 'Future of Business Summit',
    date: format(new Date().setDate(today.getDate() + 60), 'yyyy-MM-dd'),
    time: '10:00',
    location: 'Grand Hyatt, Singapore',
    description: 'A premier networking event for entrepreneurs and executives. Discuss strategies for sustainable growth and digital transformation.',
    speaker: 'Ken Adams',
    status: 'draft',
    attendees: [],
  },
  {
    id: '5',
    name: 'Local Coders Meetup',
    date: format(new Date().setDate(today.getDate() + 5), 'yyyy-MM-dd'),
    time: '19:00',
    location: 'Downtown Library',
    description: 'Casual monthly meetup for local developers. This month, we\'re discussing serverless architectures. All skill levels welcome!',
    speaker: 'Community Lead',
    status: 'published',
    attendees: [
      { id: 'd1', name: 'Frank Castle', email: 'frank@example.com', registeredAt: format(subDays(today, 1), 'yyyy-MM-dd') },
    ],
  },
  {
    id: '6',
    name: 'Annual Charity Gala',
    date: format(new Date().setDate(today.getDate() + 45), 'yyyy-MM-dd'),
    time: '20:00',
    location: 'The Starlight Ballroom',
    description: 'An elegant evening of dining and entertainment to support a great cause. Black-tie optional.',
    speaker: 'Celebrity Host',
    status: 'canceled',
    attendees: [],
  },
];


export async function getEvents(): Promise<Event[]> {
  try {
    const eventsCollection = collection(db, 'events');
    const eventSnapshot = await getDocs(eventsCollection);
    
    if (eventSnapshot.empty) {
      console.log('No events found in Firestore. Seeding mock data...');
      // await seedMockData();
      // const seededSnapshot = await getDocs(eventsCollection);
      // return getEventsFromSnapshot(seededSnapshot);
       return mockEvents; // Returning mock data if firestore is empty
    }

    return getEventsFromSnapshot(eventSnapshot);

  } catch (error) {
    console.error("Error fetching events:", error);
    // Fallback to mock data if Firestore fails
    return mockEvents;
  }
}

async function getEventsFromSnapshot(eventSnapshot: any): Promise<Event[]> {
    const eventsList = eventSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      attendees: [] // attendees will be fetched separately
    })) as Event[];

    // Fetch all attendees for all events in parallel
    const allAttendeesQuery = query(collectionGroup(db, 'attendees'));
    const allAttendeesSnapshot = await getDocs(allAttendeesQuery);
    const attendeesMap = new Map<string, Attendee[]>();

    allAttendeesSnapshot.forEach(doc => {
        const attendee = { id: doc.id, ...doc.data() } as Attendee;
        const eventId = doc.ref.parent.parent?.id;
        if (eventId) {
            if (!attendeesMap.has(eventId)) {
                attendeesMap.set(eventId, []);
            }
            attendeesMap.get(eventId)!.push(attendee);
        }
    });

    // Attach attendees to their respective events
    eventsList.forEach(event => {
        event.attendees = attendeesMap.get(event.id) || [];
    });

    return eventsList;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  try {
    const eventDocRef = doc(db, 'events', id);
    const eventDoc = await getDoc(eventDocRef);

    if (!eventDoc.exists()) {
      return undefined;
    }

    const eventData = eventDoc.data() as Omit<Event, 'id' | 'attendees'>;

    const attendeesCollectionRef = collection(eventDocRef, 'attendees');
    const attendeeSnapshot = await getDocs(attendeesCollectionRef);
    const attendees = attendeeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Attendee[];

    return {
      id: eventDoc.id,
      ...eventData,
      attendees,
    };
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    // Fallback to mock data if Firestore fails
    return mockEvents.find(event => event.id === id);
  }
}