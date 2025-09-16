import { getEvents } from '@/app/lib/data';
import { AppLayout } from '@/components/app-layout';
import { ProtectedRoute } from '@/hooks/use-auth';
import { RafflePageContent } from './_components/raffle-page-content';
import type { Event } from '@/app/lib/definitions';

// Mock data for raffles - in a real app, this would come from your database
const mockRaffles = [
    {
        id: 'raffle-1',
        eventId: '1',
        eventName: 'Tech Innovators Conference 2024',
        prize: 'Latest Smartphone',
        numberOfWinners: 1,
        status: 'finished' as const,
        winners: [
            { attendeeId: 'a1', name: 'Alice Johnson', email: 'alice@example.com' }
        ],
        drawnAt: '2024-07-20T10:00:00Z',
    },
    {
        id: 'raffle-2',
        eventId: '2',
        eventName: 'Creative Design Workshop',
        prize: '1 Year Adobe CC Subscription',
        numberOfWinners: 3,
        status: 'active' as const,
        winners: [],
        drawnAt: null,
    },
    {
        id: 'raffle-3',
        eventId: '5',
        eventName: 'Local Coders Meetup',
        prize: 'Mechanical Keyboard',
        numberOfWinners: 1,
        status: 'upcoming' as const,
        winners: [],
        drawnAt: null,
    },
];

export default async function RafflePage() {
  const events: Event[] = await getEvents();
  
  // In a real app, you would fetch raffles from Firestore
  const raffles = mockRaffles;

  return (
    <ProtectedRoute>
      <AppLayout>
        <RafflePageContent allEvents={events} raffles={raffles} />
      </AppLayout>
    </ProtectedRoute>
  );
}
