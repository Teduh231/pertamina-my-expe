export type EventStatus = 'draft' | 'published' | 'canceled';

export type Event = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  speaker: string;
  status: EventStatus;
  attendees: Attendee[];
};

export type Attendee = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  customResponse?: string;
};

export type RaffleWinner = {
  attendeeId: string;
  name: string;
  email: string;
};

export type RaffleStatus = 'upcoming' | 'active' | 'finished';

export type Raffle = {
  id: string;
  eventId: string;
  eventName: string;
  prize: string;
  numberOfWinners: number;
  status: RaffleStatus;
  winners: RaffleWinner[];
  drawnAt: string | null;
};
