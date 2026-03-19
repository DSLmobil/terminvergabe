interface Props {
  emails: string;
  onChange: (val: string) => void;
}

export default function EmailList({ emails, onChange }: Props) {
  return (
    <div className="card-static p-7">
      <div className="flex items-center gap-3 mb-6">
        <div style={{ background: 'linear-gradient(135deg, #007AFF, #5AC8FA)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>E-Mail Liste</h2>
          <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>Eine E-Mail pro Zeile eingeben — wird automatisch gespeichert</p>
        </div>
      </div>

      <textarea
        className="input-field"
        style={{ minHeight: 180, resize: 'vertical', lineHeight: 1.7 }}
        value={emails}
        onChange={e => onChange(e.target.value)}
        placeholder={"E-Mails hier einfügen\nz.B. max.mustermann@example.de\nanna.mueller@example.de"}
        spellCheck={false}
      />

      <div style={{ marginTop: 10 }}>
        <span style={{ fontSize: 13, color: '#8E8E93' }}>
          {emails.split('\n').filter(l => l.trim()).length} Einträge
        </span>
      </div>
    </div>
  );
}
