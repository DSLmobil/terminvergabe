import { useState, useEffect, useCallback } from 'react';
import type { Appointment, TimeSlot, Booking } from './types';
import { SLOT_LABELS } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import AdminView from './components/AdminView';
import CustomerView from './components/CustomerView';
import { supabase, supabaseConfigured } from './lib/supabase';
import * as api from './lib/api';
import './index.css';

const LS_EMAILS = 'tv_emails';

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(appointments: Appointment[]) {
  const rows = [['Datum', 'Ort', 'Zeitoption', 'Gebucht', 'Maximum', 'Verfügbar']];
  for (const a of appointments) {
    const date = new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    for (const [key, label] of Object.entries(SLOT_LABELS) as [TimeSlot, string][]) {
      const s = a.slots[key];
      rows.push([date, a.location ?? '', label, String(s.booked), String(s.max), String(s.max - s.booked)]);
    }
  }
  const csv = rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terminbuchungen_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Kunden-Ansicht mit Token ─────────────────────────────────────────────────

function TokenCustomerView({ token }: { token: string }) {
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [email, setEmail]               = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    api.getTokenData(token)
      .then(data => {
        if (!data) {
          setError('Dieser Link ist ungültig oder abgelaufen.');
        } else {
          setEmail(data.email);
          setAppointments(data.appointments);
        }
      })
      .catch(() => setError('Verbindungsfehler. Bitte versuchen Sie es erneut.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleBook = useCallback(async (appointmentId: string, slot: TimeSlot) => {
    const result = await api.bookSlot(appointmentId, slot, token);
    if (!result.success) {
      if (result.error === 'already_booked')
        throw new Error('Sie haben bereits einen Termin gebucht.');
      if (result.error === 'slot_full')
        throw new Error('Dieser Platz ist leider nicht mehr verfügbar.');
      throw new Error('Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
    // Aktuelle Belegung neu laden
    const updated = await api.getTokenData(token);
    if (updated) setAppointments(updated.appointments);
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8E8E93', fontSize: 16 }}>Wird geladen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card-static" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px' }}>Link ungültig</h2>
          <p style={{ fontSize: 15, color: '#8E8E93', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      <header style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
          <img
            src="/DSLmobil logo.png"
            alt="DSLmobil"
            style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ marginBottom: 28 }} className="fade-up">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: 0, letterSpacing: -0.5 }}>Terminbuchung</h1>
        </div>
        <div className="fade-up">
          <CustomerView appointments={appointments} onBook={handleBook} email={email} />
        </div>
      </main>
    </div>
  );
}

// ─── Haupt-App (Admin) ────────────────────────────────────────────────────────

export default function App() {
  // Supabase noch nicht konfiguriert → Setup-Hinweis zeigen
  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔧</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: '0 0 12px' }}>Supabase noch nicht eingerichtet</h2>
          <p style={{ fontSize: 15, color: '#8E8E93', margin: '0 0 24px', lineHeight: 1.6 }}>
            Erstelle eine Datei <code style={{ background: '#F5F5F7', padding: '2px 6px', borderRadius: 6, fontSize: 13 }}>.env.local</code> im Projektordner mit folgendem Inhalt:
          </p>
          <div style={{ background: '#1d1d1f', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
            <code style={{ color: '#34C759', fontSize: 13, lineHeight: 1.8, display: 'block', whiteSpace: 'pre' }}>
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key`}
            </code>
          </div>
          <p style={{ fontSize: 13, color: '#8E8E93', margin: 0 }}>
            Die Keys findest du in Supabase unter <strong>Settings → API</strong>.<br/>
            Danach den Dev-Server neu starten.
          </p>
        </div>
      </div>
    );
  }

  // Token in URL? → Kunden-Ansicht anzeigen
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) return <TokenCustomerView token={token} />;

  return <AdminApp />;
}

function AdminApp() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sentIds, setSentIds]           = useState<Set<string>>(new Set());
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [emails, setEmails]             = useLocalStorage<string>(LS_EMAILS, '');
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [showReset, setShowReset]       = useState(false);
  const [resetting, setResetting]       = useState(false);

  // ── Daten laden ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.getAppointments(),
      api.getPublishedAppointmentIds(),
      api.getBookings(),
    ])
      .then(([appts, publishedIds, bkgs]) => {
        setAppointments(appts);
        setSentIds(new Set(publishedIds));
        setBookings(bkgs);
      })
      .catch(() => setLoadError('Verbindung zu Supabase fehlgeschlagen. Prüfe deine .env.local Datei.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Realtime (Admin-Panel aktualisiert sich automatisch) ────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        api.getAppointments().then(setAppointments);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        api.getBookings().then(setBookings);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Handler ────────────────────────────────────────────────────────────────
  const addAppointment = (a: Appointment) => {
    api.createAppointment(a).then(created => {
      setAppointments(prev => [...prev, created].sort((x, y) => x.date.localeCompare(y.date)));
    });
  };

  const deleteAppointment = (id: string) => {
    api.deleteAppointment(id).then(() => {
      setAppointments(prev => prev.filter(a => a.id !== id));
      setSentIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    });
  };

  const handleSent = (ids: string[]) => {
    setSentIds(prev => new Set([...prev, ...ids]));
  };

  const handleExportAndReset = () => {
    exportCSV(appointments);
    setShowReset(true);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetAll();
      localStorage.removeItem(LS_EMAILS);
      setAppointments([]);
      setSentIds(new Set());
      setBookings([]);
      setEmails('');
    } finally {
      setResetting(false);
      setShowReset(false);
    }
  };

  const hasData = appointments.length > 0 || emails.trim().length > 0;

  // ── Ladezustand ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8E8E93', fontSize: 16 }}>Verbinde mit Supabase…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card-static" style={{ maxWidth: 480, width: '100%', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#FF3B30', margin: '0 0 10px' }}>Verbindungsfehler</h2>
          <p style={{ fontSize: 14, color: '#8E8E93', margin: 0 }}>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/DSLmobil logo.png"
              alt="DSLmobil"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {appointments.length > 0 && (
              <button
                className="btn-secondary"
                onClick={handleExportAndReset}
                style={{ fontSize: 13, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export & Neue Umfrage
              </button>
            )}
            {!appointments.length && hasData && (
              <button className="btn-secondary" onClick={() => setShowReset(true)} style={{ fontSize: 13, padding: '7px 14px' }}>
                Zurücksetzen
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ marginBottom: 28 }} className="fade-up">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: '0 0 6px', letterSpacing: -0.5 }}>Verwaltung</h1>
          <p style={{ fontSize: 15, color: '#8E8E93', margin: 0 }}>E-Mails verwalten, Termine erstellen und Einladungen versenden</p>
        </div>

        <div className="fade-up">
          <AdminView
            appointments={appointments}
            onAddAppointment={addAppointment}
            onDeleteAppointment={deleteAppointment}
            sentIds={sentIds}
            onSent={handleSent}
            emails={emails}
            onEmailsChange={setEmails}
            bookings={bookings}
          />
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      {showReset && (
        <div
          className="fade-in"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowReset(false)}
        >
          <div className="scale-in card-static" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FFF5F5', border: '1.5px solid #FFD0CC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px', letterSpacing: -0.3 }}>
              Umfrage zurücksetzen?
            </h2>
            <p style={{ fontSize: 14, color: '#8E8E93', margin: '0 0 28px', lineHeight: 1.6 }}>
              Alle Termine, Tokens und Buchungen werden unwiderruflich gelöscht.{' '}
              {appointments.length > 0 && 'Der Export wurde bereits heruntergeladen.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" onClick={() => setShowReset(false)} style={{ flex: 1, justifyContent: 'center' }}>
                Abbrechen
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#FF3B30', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', opacity: resetting ? 0.6 : 1 }}
              >
                {resetting ? 'Wird gelöscht…' : 'Ja, zurücksetzen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
