import { useState } from 'react';
import type { Appointment } from '../types';
import { SLOT_LABELS } from '../types';
import * as api from '../lib/api';

interface Props {
  selectedAppointments: Appointment[];
  emails: string;
  onSent: (ids: string[]) => void;
}

interface TokenResult {
  email: string;
  token: string;
  link: string;
}

function buildMailtoBody(appointments: Appointment[], tokenResults: TokenResult[]): string {
  const appointmentLines = appointments.map(a => {
    const date = new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const slots = (['morning', 'afternoon', 'fullday'] as const)
      .map(key => {
        const s = a.slots[key];
        const remaining = s.max - s.booked;
        return `  • ${SLOT_LABELS[key]}: ${remaining <= 0 ? 'Ausgebucht' : `${remaining} Plätze verfügbar`}`;
      })
      .join('\n');
    return `📅 ${date}\n${slots}`;
  }).join('\n\n');

  // Alle individuellen Links auflisten
  const linkLines = tokenResults.map(r => `${r.email}:\n${r.link}`).join('\n\n');

  return (
    `Guten Tag,\n\n` +
    `die DSLmobil lädt Sie herzlich ein, einen Termin auszuwählen.\n\n` +
    `Bitte öffnen Sie Ihren persönlichen Buchungslink:\n\n` +
    `${linkLines}\n\n` +
    `Verfügbare Termine:\n\n` +
    `${appointmentLines}\n\n` +
    `Bitte buchen Sie Ihren Termin so früh wie möglich.\n\n` +
    `Mit freundlichen Grüßen\n` +
    `Ihr DSLmobil-Team`
  );
}

export default function InvitationSender({ selectedAppointments, emails, onSent }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [tokenResults, setTokenResults] = useState<TokenResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const emailList = emails.split('\n').map(e => e.trim()).filter(Boolean);
  const count = selectedAppointments.length;
  const emailCount = emailList.length;
  const disabled = count === 0 || emailCount === 0;

  const handleSend = async () => {
    if (disabled) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const appointmentIds = selectedAppointments.map(a => a.id);
      const results = await api.createTokensForEmails(emailList, appointmentIds);
      const baseUrl = window.location.origin;
      const tokenResultsWithLinks: TokenResult[] = results.map(r => ({
        email: r.email,
        token: r.token,
        link: `${baseUrl}/?token=${r.token}`,
      }));
      setTokenResults(tokenResultsWithLinks);
      setStatus('done');
      onSent(appointmentIds);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setStatus('error');
    }
  };

  const handleCopyAll = () => {
    const text = tokenResults.map(r => `${r.email}\t${r.link}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenOutlook = () => {
    const subject = 'Termineinladung – bitte Termin auswählen';
    const body = buildMailtoBody(selectedAppointments, tokenResults);
    const allEmails = emailList.join(',');
    // Öffnet Outlook mit allen Empfängern — Admin muss für jeden eine separate Mail senden
    window.location.href = `mailto:?bcc=${encodeURIComponent(allEmails)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // ─── Erfolgszustand: Links anzeigen ──────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="card-static fade-in" style={{ padding: '20px 24px', border: '1.5px solid rgba(52,199,89,0.4)', background: '#F5FFF8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1d9e3e', margin: 0 }}>
              {tokenResults.length} individuelle Links generiert
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={handleCopyAll}
              style={{ fontSize: 13, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              {copied ? 'Kopiert!' : 'Alle kopieren'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleOpenOutlook}
              style={{ fontSize: 13, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Outlook öffnen
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {tokenResults.map(r => (
            <div
              key={r.token}
              style={{ background: 'white', borderRadius: 10, border: '1.5px solid #E5E5EA', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>{r.email}</div>
                <div style={{ fontSize: 12, color: '#007AFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.link}</div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(r.link); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#8E8E93', flexShrink: 0, borderRadius: 6, transition: 'color 0.15s' }}
                title="Link kopieren"
                onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8E8E93')}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#8E8E93', margin: '14px 0 0', textAlign: 'center' }}>
          Kopiere die Links und sende sie manuell per E-Mail — oder nutze "Outlook öffnen" für eine Sammel-E-Mail.
        </p>
      </div>
    );
  }

  // ─── Standard-Zustand ─────────────────────────────────────────────────────────
  return (
    <div
      className="card-static"
      style={{
        padding: '20px 24px',
        border: count > 0 ? '1.5px solid rgba(0,122,255,0.25)' : '1.5px solid transparent',
        background: count > 0 ? '#FAFCFF' : '#ffffff',
        transition: 'all 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>
              Einladungen versenden
            </h2>
            {count > 0 && (
              <span className="fade-in" style={{ background: '#007AFF', color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {count} Termin{count !== 1 ? 'e' : ''} ausgewählt
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: status === 'error' ? '#FF3B30' : '#8E8E93', margin: 0 }}>
            {status === 'error'
              ? `Fehler: ${errorMsg}`
              : count === 0
              ? 'Wählen Sie oben Termine aus, um Einladungen zu senden'
              : emailCount === 0
              ? 'Keine E-Mails in der Liste eingetragen'
              : `Generiert individuelle Token-Links für ${emailCount} Empfänger`}
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={disabled || status === 'loading'}
          style={{ minWidth: 190, justifyContent: 'center', opacity: disabled ? 0.45 : 1 }}
        >
          {status === 'loading' ? (
            <>Wird generiert…</>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Links generieren
            </>
          )}
        </button>
      </div>
    </div>
  );
}
