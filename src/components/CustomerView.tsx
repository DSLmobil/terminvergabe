import { useState } from 'react';
import type { Appointment, TimeSlot, BookingSelection } from '../types';
import { SLOT_LABELS } from '../types';
import { isFull } from '../utils';

interface Props {
  appointments: Appointment[];
  onBook: (appointmentId: string, slot: TimeSlot) => void | Promise<void>;
  email?: string;
  isPreview?: boolean;
}

function CheckmarkAnimation() {
  return (
    <div className="scale-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #34C759, #30D158)', margin: '0 auto 20px' }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <polyline
          className="check-path"
          points="7,19 15,27 29,11"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function CustomerView({ appointments, onBook, email, isPreview }: Props) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Show only the first 3 appointments
  const visible = appointments.slice(0, 3);

  const handleSelect = (appointmentId: string, slot: TimeSlot) => {
    setBookingError(null);
    if (selection?.appointmentId === appointmentId && selection?.slot === slot) {
      setSelection(null);
    } else {
      setSelection({ appointmentId, slot });
    }
  };

  const handleConfirm = async () => {
    if (!selection || booking) return;
    setBooking(true);
    setBookingError(null);
    try {
      await onBook(selection.appointmentId, selection.slot);
      setBooked(true);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Buchung fehlgeschlagen.');
    } finally {
      setBooking(false);
    }
  };

  const slotKeys: TimeSlot[] = ['morning', 'afternoon', 'fullday'];

  if (booked) {
    return (
      <div className="fade-up" style={{ textAlign: 'center', padding: '60px 0' }}>
        <img src="/DSLmobil logo.png" alt="DSLmobil" style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 24, opacity: 0.7 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <CheckmarkAnimation />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', marginBottom: 10, letterSpacing: -0.3 }}>
          Termin bestätigt!
        </h2>
        <p style={{ fontSize: 16, color: '#8E8E93', marginBottom: 8 }}>
          Ihr Termin wurde erfolgreich gebucht.
        </p>
        {email && (
          <p style={{ fontSize: 14, color: '#8E8E93', marginBottom: 8 }}>
            Bestätigung für: <strong style={{ color: '#1d1d1f' }}>{email}</strong>
          </p>
        )}
        {selection && (
          <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0F7FF', border: '1.5px solid #007AFF', borderRadius: 12, padding: '10px 20px', marginBottom: 32, marginTop: 8 }}>
            <svg width="14" height="14" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#007AFF' }}>
              {new Date((appointments.find(a => a.id === selection.appointmentId)?.date ?? '') + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {SLOT_LABELS[selection.slot]}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Company header */}
      <div className="card-static" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <img
          src="/DSLmobil logo.png"
          alt="DSLmobil"
          style={{ height: 44, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ borderLeft: '1.5px solid #E5E5EA', paddingLeft: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', margin: '0 0 3px', letterSpacing: -0.3 }}>
            Verfügbare Termine
          </h2>
          <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>
            {email
              ? <>Buchung für <strong>{email}</strong></>
              : 'Wählen Sie einen Termin und eine Zeitoption aus'}
          </p>
        </div>
      </div>

      {isPreview && (
        <div style={{ background: '#FFF9E6', border: '1.5px solid #FF9500', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#995700' }}>
          <strong>Vorschau-Modus:</strong> Kunden buchen über ihren persönlichen Token-Link.
        </div>
      )}

      {visible.length === 0 ? (
        <div className="card-static" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📭</div>
          <p style={{ color: '#1d1d1f', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>Keine Termine verfügbar</p>
          <p style={{ color: '#8E8E93', fontSize: 14, margin: 0 }}>Sie erhalten eine E-Mail, sobald Termine freigegeben wurden.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          {visible.map(appt => {
            const isSelected = selection?.appointmentId === appt.id;

            return (
              <div
                key={appt.id}
                className="card"
                style={{
                  padding: 20,
                  border: isSelected ? '2px solid #007AFF' : '2px solid transparent',
                  boxShadow: isSelected ? '0 0 0 4px rgba(0,122,255,0.12), 0 8px 24px rgba(0,0,0,0.10)' : undefined,
                }}
              >
                {/* Date */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#007AFF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                    {new Date(appt.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long' })}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.2 }}>
                    {new Date(appt.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}
                  </div>
                </div>

                {/* Slot buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slotKeys.map(key => {
                    const slot = appt.slots[key];
                    const full = isFull(slot.booked, slot.max);
                    const selected = selection?.appointmentId === appt.id && selection?.slot === key;
                    const remaining = slot.max - slot.booked;

                    return (
                      <button
                        key={key}
                        className={`slot-btn${selected ? ' selected' : ''}`}
                        disabled={full || isPreview}
                        onClick={() => !full && !isPreview && handleSelect(appt.id, key)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{SLOT_LABELS[key]}</span>
                          {full ? (
                            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>Ausgebucht</span>
                          ) : (
                            <span style={{ fontSize: 11, opacity: selected ? 0.85 : 0.6, fontWeight: 500 }}>
                              {remaining} frei
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {bookingError && (
        <div className="fade-in" style={{ background: '#FFF5F5', border: '1.5px solid #FFD0CC', borderRadius: 12, padding: '12px 16px', marginBottom: 16, textAlign: 'center', fontSize: 14, color: '#FF3B30' }}>
          {bookingError}
        </div>
      )}

      {/* Confirm button */}
      {!isPreview && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <button
            className="btn-primary"
            disabled={!selection || booking}
            onClick={handleConfirm}
            style={{ minWidth: 240, justifyContent: 'center', fontSize: 16, padding: '14px 32px', borderRadius: 14 }}
          >
            {booking ? (
              <>Wird gebucht…</>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Termin bestätigen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
