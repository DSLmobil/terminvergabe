import { useState } from 'react';
import EmailList from './EmailList';
import AppointmentCreator from './AppointmentCreator';
import AppointmentCard from './AppointmentCard';
import InvitationSender from './InvitationSender';
import type { Appointment, Booking } from '../types';

interface Props {
  appointments: Appointment[];
  onAddAppointment: (a: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  sentIds: Set<string>;
  onSent: (ids: string[]) => void;
  emails: string;
  onEmailsChange: (val: string) => void;
  bookings: Booking[];
}

export default function AdminView({ appointments, onAddAppointment, onDeleteAppointment, sentIds, onSent, emails, onEmailsChange, bookings }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === appointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(appointments.map(a => a.id)));
    }
  };

  const handleSent = (ids: string[]) => {
    onSent(ids);
    setSelectedIds(new Set());
  };

  const selectedAppointments = appointments.filter(a => selectedIds.has(a.id));
  const allSelected = appointments.length > 0 && selectedIds.size === appointments.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <EmailList emails={emails} onChange={onEmailsChange} />
      <AppointmentCreator onAdd={onAddAppointment} />

      {/* Appointments Overview */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: '0 0 3px' }}>Terminübersicht</h2>
            <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>
              {appointments.length} Termin{appointments.length !== 1 ? 'e' : ''} — Termin(e) anklicken zum Auswählen
            </p>
          </div>
          {appointments.length > 1 && (
            <button
              className="btn-secondary"
              onClick={toggleAll}
              style={{ fontSize: 13, padding: '7px 14px' }}
            >
              {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="card-static" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <p style={{ color: '#8E8E93', fontSize: 15, margin: 0 }}>Noch keine Termine erstellt</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {appointments.map(a => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onDelete={onDeleteAppointment}
                selectable
                selected={selectedIds.has(a.id)}
                onToggleSelect={toggleSelect}
                invitationSent={sentIds.has(a.id)}
                bookings={bookings.filter(b => b.appointment_id === a.id)}
              />
            ))}
          </div>
        )}
      </div>

      <InvitationSender selectedAppointments={selectedAppointments} emails={emails} onSent={handleSent} />
    </div>
  );
}
