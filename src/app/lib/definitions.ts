export type BoothStatus = 'draft' | 'published' | 'canceled';

export type Booth = {
  id: string;
  name: string;
  location: string;
  description: string;
  booth_manager: string;
  status: BoothStatus;
  attendees: Attendee[];
  raffles: Raffle[];
  created_at: string;
  image_url?: string;
};

export type Attendee = {
  id: string;
  // booth_id is no longer needed here. An attendee is not tied to a single booth.
  name: string;
  email: string;
  registered_at: string;
  custom_response?: string;
  qr_code_url?: string;
  points: number;
};

export type CheckIn = {
  id: string;
  attendee_id: string;
  booth_id: string;
  checked_in_at: string;
}

export type RaffleWinner = {
  attendeeId: string;
  name: string;
  email: string;
};

export type RaffleStatus = 'upcoming' | 'active' | 'finished';

export type Raffle = {
  id:string;
  booth_id: string;
  boothName: string;
  prize: string;
  number_of_winners: number;
  status: RaffleStatus;
  winners: RaffleWinner[];
  drawn_at: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  booth_id: string;
  name: string;
  points: number;
  stock: number;
  image_url?: string;
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

export type Tenant = {
  id: string;
  name: string;
  email: string;
  booth_id: string | null;
  boothName?: string;
};

export type UserProfile = {
  role: string;
  booth_id: string | null;
};
