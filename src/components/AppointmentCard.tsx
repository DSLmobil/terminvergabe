import { useState } from 'react';
import type { Appointment, TimeSlot, Booking } from '../types';
import { SLOT_LABELS } from '../types';
import { fillPercent, fillColor, isFull } from '../utils';

interface Props {
  appointment: Appointment;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  invitationSent?: boolean;
  bookings?: Booking[];
}

const slotKeys: TimeSlot[] = ['morning', 'afternoon', 'fullday'];

export default function AppointmentCard({ appointment, onDelete, selectable, selected, onToggleSelect, invitationSent, bookings = [] }: Props) {
  const [showBookings, setShowBookings] = useState(false);
  const allFull = slotKeys.every(k => isFull(appointment.slots[k].booked, appointment.slots[k].max));

  return (
    <div
      className="card p-6"
      style={{
        opacity: allFull ? 0.65 : 1,
        position: 'relative',
        border: selected ? '2px solid #007AFF' : '2px solid transparent',
        boxShadow: selected
          ? '0 0 0 4px rgba(0,122,255,0.12), 0 8px 24px rgba(0,0,0,0.10)'
          : undefined,
        cursor: selectable ? 'pointer' : 'default',
      }}
      onClick={() => selectable && onToggleSelect?.(appointment.id)}
    >
      {/* Selection indicator */}
      {selectable && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: selected ? 'none' : '2px solid #C7C7CC',
            background: selected ? '#007AFF' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          {selected && (
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      )}

      {!selectable && allFull && (
        <span className="badge-full" style={{ position: 'absolute', top: 16, right: 16 }}>
          Ausgebucht
        </span>
      )}
      {selectable && allFull && (
        <span className="badge-full" style={{ position: 'absolute', top: 16, right: 44 }}>
          Ausgebucht
        </span>
      )}

      {/* Date Header */}
      <div style={{ marginBottom: 20, paddingRight: selectable ? 28 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#007AFF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {new Date(appointment.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long' })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.3 }}>
          {new Date(appointment.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        {appointment.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
            <svg width="12" height="12" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500 }}>{appointment.location}</span>
          </div>
        )}
      </div>

      {/* Invitation sent banner */}
      {invitationSent && (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #F0FFF4, #E8FFF0)', border: '1.5px solid #34C759', borderRadius: 10, padding: '9px 12px', marginBottom: 16 }}>
          <svg width="14" height="14" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1d9e3e', lineHeight: 1.3 }}>Einladung versendet</div>
            <div style={{ fontSize: 11, color: '#34C759', lineHeight: 1.3 }}>Umfrage aktiv</div>
          </div>
        </div>
      )}

      {/* Slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slotKeys.map(key => {
          const slot = appointment.slots[key];
          const pct = fillPercent(slot.booked, slot.max);
          const color = fillColor(pct);
          const full = isFull(slot.booked, slot.max);

          return (
            <div key={key} style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{SLOT_LABELS[key]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#8E8E93' }}>
                    {slot.booked}/{slot.max}
                  </span>
                  {full
                    ? <span className="badge-full">Voll</span>
                    : pct >= 70
                    ? <span className="badge-partial">{pct}%</span>
                    : <span className="badge-available">Frei</span>
                  }
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gebuchte Kunden */}
      {bookings.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={e => { e.stopPropagation(); setShowBookings(v => !v); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E5E5EA', background: '#F5F5F7', color: '#1d1d1f', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {bookings.length} Buchung{bookings.length !== 1 ? 'en' : ''}
            </span>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ transform: showBookings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showBookings && (
            <div className="fade-in" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bookings.map(b => (
                <div
                  key={b.id}
                  onClick={e => e.stopPropagation()}
                  style={{ background: '#F0FFF4', border: '1.5px solid #C6F0D3', borderRadius: 9, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 500 }}>{b.email}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1d9e3e', background: '#DCF5E4', borderRadius: 6, padding: '2px 8px' }}>
                    {SLOT_LABELS[b.slot_type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(appointment.id); }}
          style={{ marginTop: 14, width: '100%', padding: '9px 0', borderRadius: 10, border: '1.5px solid #FFE5E5', background: '#FFF5F5', color: '#FF3B30', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FF3B30'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.color = '#FF3B30'; }}
        >
          Termin löschen
        </button>
      )}
    </div>
  );
}
