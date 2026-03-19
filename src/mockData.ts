import type { Appointment } from './types';

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: '2026-04-07',
    slots: {
      morning:   { max: 10, booked: 8 },
      afternoon: { max: 10, booked: 10 },
      fullday:   { max: 5,  booked: 2 },
    },
  },
  {
    id: '2',
    date: '2026-04-14',
    slots: {
      morning:   { max: 12, booked: 4 },
      afternoon: { max: 12, booked: 12 },
      fullday:   { max: 6,  booked: 6 },
    },
  },
  {
    id: '3',
    date: '2026-04-21',
    slots: {
      morning:   { max: 8,  booked: 0 },
      afternoon: { max: 8,  booked: 3 },
      fullday:   { max: 4,  booked: 1 },
    },
  },
  {
    id: '4',
    date: '2026-04-28',
    slots: {
      morning:   { max: 10, booked: 10 },
      afternoon: { max: 10, booked: 10 },
      fullday:   { max: 5,  booked: 5 },
    },
  },
];

export const mockEmails = [
  'anna.mueller@example.de',
  'thomas.wagner@example.de',
  'sabine.becker@example.de',
  'michael.hoffmann@example.de',
  'julia.schulz@example.de',
];
