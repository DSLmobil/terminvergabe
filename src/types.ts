export type TimeSlot = 'morning' | 'afternoon' | 'fullday';

export interface SlotBooking {
  max: number;
  booked: number;
}

export interface Appointment {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  location?: string;
  slots: {
    morning: SlotBooking;
    afternoon: SlotBooking;
    fullday: SlotBooking;
  };
}

export interface BookingSelection {
  appointmentId: string;
  slot: TimeSlot;
}

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Vormittag',
  afternoon: 'Nachmittag',
  fullday: 'Ganztag',
};

export interface Booking {
  id:             string;
  appointment_id: string;
  token_id:       string | null;
  email:          string;
  slot_type:      TimeSlot;
  created_at:     string;
}
