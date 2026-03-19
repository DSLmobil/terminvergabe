import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SLOT_LABELS: Record<string, string> = {
  morning:   'Vormittag',
  afternoon: 'Nachmittag',
  fullday:   'Ganztag',
};

interface Slot       { max: number; booked: number; }
interface Appointment {
  id: string; date: string; location?: string;
  slots: { morning: Slot; afternoon: Slot; fullday: Slot; };
}
interface Recipient  { email: string; link: string; }

function buildHtml(email: string, link: string, appointments: Appointment[]): string {
  const logoUrl = 'https://terminvergabe-dslmobil.vercel.app/DSLmobil%20logo.png';

  const appointmentBlocks = appointments.map(a => {
    const date = new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

    const slotRows = (['morning', 'afternoon', 'fullday'] as const).map(key => {
      const slot = a.slots[key];
      const remaining = slot.max - slot.booked;
      const full = remaining <= 0;
      return `
        <tr>
          <td style="padding:10px 16px;font-size:14px;color:${full ? '#8E8E93' : '#1d1d1f'};">${SLOT_LABELS[key]}</td>
          <td style="padding:10px 16px;text-align:right;">
            ${full
              ? '<span style="color:#FF3B30;font-size:13px;font-weight:600;">Ausgebucht</span>'
              : `<span style="color:#34C759;font-size:13px;font-weight:600;">${remaining} Plätze frei</span>`
            }
          </td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1.5px solid #E5E5EA;">
        <div style="padding:14px 16px;background:linear-gradient(135deg,#007AFF,#5AC8FA);">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.8);">
            ${new Date(a.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long' })}
          </div>
          <div style="font-size:20px;font-weight:700;color:white;margin-top:2px;">${date.split(',').slice(1).join(',').trim()}</div>
          ${a.location ? `<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">📍 ${a.location}</div>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;background:white;">
          ${slotRows}
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="${logoUrl}" alt="DSLmobil" style="height:44px;width:auto;" />
        </td></tr>

        <!-- Main Card -->
        <tr><td style="background:white;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <h1 style="margin:0 0 6px;font-size:26px;font-weight:700;color:#1d1d1f;letter-spacing:-0.5px;">
            Ihre Termineinladung
          </h1>
          <p style="margin:0 0 6px;font-size:14px;color:#8E8E93;">DSLmobil – Glasfaser Montage</p>
          <hr style="border:none;border-top:1.5px solid #F5F5F7;margin:20px 0;">

          <!-- Greeting -->
          <p style="margin:0 0 24px;font-size:15px;color:#1d1d1f;line-height:1.7;">
            Guten Tag,<br><br>
            für die <strong>Glasfaser-Einbringung und Endmontage</strong> bei Ihnen möchten wir
            gerne einen gemeinsamen Termin vereinbaren.<br><br>
            Bitte wählen Sie aus den verfügbaren Terminen denjenigen, der für Sie am besten passt,
            und bestätigen Sie Ihre Buchung über Ihren persönlichen Link.<br><br>
            Bitte stellen Sie sicher, dass Sie oder eine berechtigte Person zum gewählten Termin
            vor Ort ist, um unseren Monteuren Zugang zu ermöglichen.
          </p>

          <!-- Appointments -->
          <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#1d1d1f;">
            Verfügbare Termine
          </h2>
          ${appointmentBlocks}

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0 28px;">
            <a href="${link}"
               style="display:inline-block;background:#007AFF;color:white;text-decoration:none;
                      padding:16px 44px;border-radius:14px;font-size:16px;font-weight:600;
                      letter-spacing:-0.2px;">
              Jetzt Termin buchen &rarr;
            </a>
          </div>

          <!-- Note -->
          <p style="margin:0;font-size:13px;color:#8E8E93;text-align:center;line-height:1.7;">
            Dieser Link ist persönlich und nur für Sie bestimmt.<br>
            Bitte buchen Sie Ihren Termin so früh wie möglich.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#8E8E93;line-height:1.7;">
            Mit freundlichen Grüßen<br>
            <strong style="color:#1d1d1f;">Ihr DSLmobil-Team</strong>
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#C7C7CC;">
            DSLmobil GmbH &bull; Diese E-Mail wurde automatisch generiert.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipients, appointments }: { recipients: Recipient[]; appointments: Appointment[] } = req.body;

    const results = await Promise.allSettled(
      recipients.map(({ email, link }) =>
        resend.emails.send({
          from:    'onboarding@resend.dev',
          to:      email,
          subject: 'Ihre Termineinladung – DSLmobil',
          html:    buildHtml(email, link, appointments),
        })
      )
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({ success: true, sent, failed });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error) });
  }
}
