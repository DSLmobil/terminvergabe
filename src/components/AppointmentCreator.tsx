import { useState } from 'react';
import type { Appointment } from '../types';

interface Props {
  onAdd: (a: Appointment) => void;
}

const defaultSlots = { morning: 10, afternoon: 10, fullday: 5 };

export default function AppointmentCreator({ onAdd }: Props) {
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [slots, setSlots] = useState(defaultSlots);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!date) return;
    const appt: Appointment = {
      id: Date.now().toString(),
      date,
      location: location.trim() || undefined,
      slots: {
        morning:   { max: slots.morning,   booked: 0 },
        afternoon: { max: slots.afternoon, booked: 0 },
        fullday:   { max: slots.fullday,   booked: 0 },
      },
    };
    onAdd(appt);
    setDate('');
    setLocation('');
    setSlots(defaultSlots);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const slotConfig = [
    { key: 'morning' as const,   label: 'Vormittag',  icon: '🌅', color: '#FF9500' },
    { key: 'afternoon' as const, label: 'Nachmittag', icon: '☀️', color: '#FF3B30' },
    { key: 'fullday' as const,   label: 'Ganztag',    icon: '📅', color: '#007AFF' },
  ];

  return (
    <div className="card-static p-7">
      <div className="flex items-center gap-3 mb-6">
        <div style={{ background: 'linear-gradient(135deg, #34C759, #30D158)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
            <line x1="12" y1="14" x2="12" y2="18"/>
            <line x1="10" y1="16" x2="14" y2="16"/>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>Termin erstellen</h2>
          <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>Datum und Zeitoptionen festlegen</p>
        </div>
      </div>

      {/* Date Picker */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Datum
        </label>
        <input
          type="date"
          className="input-field"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* Location */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Ort
        </label>
        <input
          type="text"
          className="input-field"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="z. B. Besprechungsraum 2, München..."
        />
      </div>

      {/* Slot Max Settings */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Maximale Teilnehmer
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {slotConfig.map(({ key, label }) => (
            <div key={key} style={{ background: '#F5F5F7', borderRadius: 12, padding: '14px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 10, textAlign: 'center' }}>
                {label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <button
                  onClick={() => setSlots(s => ({ ...s, [key]: Math.max(1, s[key] - 1) }))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E5EA', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontWeight: 600, color: '#1d1d1f' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#007AFF')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E5EA')}
                >−</button>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', minWidth: 28, textAlign: 'center' }}>
                  {slots[key]}
                </span>
                <button
                  onClick={() => setSlots(s => ({ ...s, [key]: s[key] + 1 }))}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #E5E5EA', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontWeight: 600, color: '#007AFF' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#007AFF')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E5EA')}
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {added && (
          <span className="fade-in" style={{ fontSize: 13, color: '#34C759', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Termin hinzugefügt
          </span>
        )}
        {!added && <span />}
        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={!date}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Termin hinzufügen
        </button>
      </div>
    </div>
  );
}
