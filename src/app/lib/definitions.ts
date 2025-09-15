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
  imageId: string;
  attendees: Attendee[];
};

export type Attendee = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  customResponse?: string;
};
