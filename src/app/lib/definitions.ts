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
  created_at: string;
};

export type Attendee = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  registered_at: string;
  custom_response?: string;
  qr_code_url?: string;
};

export type RaffleWinner = {
  attendeeId: string;
  name: string;
  email: string;
};

export type RaffleStatus = 'upcoming' | 'active' | 'finished';

export type Raffle = {
  id:string;
  event_id: string;
  eventName: string;
  prize: string;
  number_of_winners: number;
  status: RaffleStatus;
  winners: RaffleWinner[];
  drawn_at: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  points: number;
  stock: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  user_name: string;
  product_name: string;
  points: number;
  created_at: string;
};
