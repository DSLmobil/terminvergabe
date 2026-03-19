import { supabase } from './supabase';
import type { Appointment, TimeSlot } from '../types';
import type { Booking } from '../types';

// ─── Helper: DB-Zeile → Appointment-Objekt ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAppointment(row: any): Appointment {
  return {
    id:       row.id,
    date:     row.date,
    location: row.location ?? undefined,
    slots: {
      morning:   { max: row.morning_max,   booked: row.morning_booked },
      afternoon: { max: row.afternoon_max, booked: row.afternoon_booked },
      fullday:   { max: row.fullday_max,   booked: row.fullday_booked },
    },
  };
}

// ─── Token-Generator ──────────────────────────────────────────────────────────

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date');
  if (error) throw error;
  return (data ?? []).map(mapAppointment);
}

export async function createAppointment(a: Appointment): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      date:             a.date,
      location:         a.location ?? null,
      morning_max:      a.slots.morning.max,
      morning_booked:   0,
      afternoon_max:    a.slots.afternoon.max,
      afternoon_booked: 0,
      fullday_max:      a.slots.fullday.max,
      fullday_booked:   0,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAppointment(data);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Published Appointment IDs (haben Tokens) ────────────────────────────────

export async function getPublishedAppointmentIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('token_appointments')
    .select('appointment_id');
  if (error) throw error;
  return [...new Set((data ?? []).map((r: { appointment_id: string }) => r.appointment_id))];
}

// ─── Tokens erstellen (beim Einladungen senden) ───────────────────────────────

export async function createTokensForEmails(
  emails: string[],
  appointmentIds: string[],
): Promise<Array<{ email: string; token: string }>> {
  const results: Array<{ email: string; token: string }> = [];

  for (const email of emails) {
    const newToken = generateToken();

    // Insert token — wenn E-Mail schon existiert, bestehenden Token behalten
    await supabase
      .from('tokens')
      .upsert({ email, token: newToken }, { onConflict: 'email', ignoreDuplicates: true });

    // Aktuellen Token der E-Mail laden (neu oder bestehend)
    const { data: tokenRow, error: fetchError } = await supabase
      .from('tokens')
      .select('id, token')
      .eq('email', email)
      .single();
    if (fetchError || !tokenRow) throw fetchError ?? new Error('Token nicht gefunden');

    // Verknüpfung zu den ausgewählten Terminen erstellen
    if (appointmentIds.length > 0) {
      const links = appointmentIds.map(appointment_id => ({
        token_id: tokenRow.id,
        appointment_id,
      }));
      const { error: linkError } = await supabase
        .from('token_appointments')
        .upsert(links, { ignoreDuplicates: true });
      if (linkError) throw linkError;
    }

    results.push({ email, token: tokenRow.token as string });
  }

  return results;
}

// ─── Token-Daten laden (für Kunden-Link) ─────────────────────────────────────

export async function getTokenData(
  token: string,
): Promise<{ email: string; appointments: Appointment[] } | null> {
  // Token → E-Mail
  const { data: tokenRow, error: tokenError } = await supabase
    .from('tokens')
    .select('id, email')
    .eq('token', token)
    .single();
  if (tokenError || !tokenRow) return null;

  // Verknüpfte Termine laden
  const { data: links, error: linksError } = await supabase
    .from('token_appointments')
    .select('appointment_id')
    .eq('token_id', tokenRow.id);
  if (linksError) throw linksError;
  if (!links?.length) return { email: tokenRow.email as string, appointments: [] };

  const appointmentIds = links.map((l: { appointment_id: string }) => l.appointment_id);

  const { data: appts, error: apptsError } = await supabase
    .from('appointments')
    .select('*')
    .in('id', appointmentIds)
    .order('date');
  if (apptsError) throw apptsError;

  return {
    email:        tokenRow.email as string,
    appointments: (appts ?? []).map(mapAppointment),
  };
}

// ─── Buchung (atomisch über DB-Funktion) ─────────────────────────────────────

export async function bookSlot(
  appointmentId: string,
  slotType: TimeSlot,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('book_slot', {
    p_appointment_id: appointmentId,
    p_slot_type:      slotType,
    p_token:          token,
  });
  if (error) throw error;
  return data as { success: boolean; error?: string };
}

// ─── Buchungen laden (für Admin) ─────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

// ─── Alles zurücksetzen ───────────────────────────────────────────────────────

export async function resetAll(): Promise<void> {
  const tables = ['bookings', 'token_appointments', 'tokens', 'appointments'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Fehler beim Löschen von ${table}: ${error.message}`);
  }
}
