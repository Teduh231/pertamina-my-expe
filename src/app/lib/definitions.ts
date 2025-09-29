
export type EventStatus = 'draft' | 'published' | 'canceled' | 'pending' | 'completed';

export type Event = {
  id: string;
  user_id: string;
  name: string;
  location: string;
  description: string;
  event_manager: string;
  status: EventStatus;
  attendees: Attendee[];
  raffles: Raffle[];
  created_at: string;
  image_url?: string;
  image_path?: string;
  check_ins?: CheckIn[];
  attendee_limit: number;
  check_in_points: number;
};

export type Attendee = {
  id: string;
  name: string;
  phone_number: string;
  registered_at: string;
  custom_response?: string;
  qr_code_url?: string;
  points: number;
  level?: string;
};

export type CheckIn = {
  id: string;
  event_id: string;
  checked_in_at: string;
  phone_number: string;
};

export type RaffleWinner = {
  attendeeId: string;
  name: string;
  phone_number: string;
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
  event_id: string;
  name: string;
  points: number;
  stock: number;
  image_url?: string;
  image_path?: string;
  created_at: string;
};

export type TransactionItem = {
    product_id: string;
    product_name: string;
    quantity: number;
    points: number;
};

export type Transaction = {
  id: string;
  event_id: string;
  attendee_id: string;
  attendee_name: string;
  product_id: string;
  product_name: string;
  points_spent: number;
  created_at: string;
  items: TransactionItem[];
  discount: number;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  event_id: string | null;
  assignedEventName?: string;
};

export type UserProfile = {
  role: string;
  event_id: string | null;
};

export type Activity = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  points_reward: number;
  created_at: string;
  updated_at: string;
  participant_count: number;
};

export type ActivityParticipant = {
  id: string;
  activity_id: string;
  attendee_id: string;
  completed_at: string;
  points_awarded: number;
  attendees: {
    name: string;
    phone_number: string;
  };
};


    
