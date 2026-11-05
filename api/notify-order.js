import nodemailer from 'nodemailer';

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const ADMIN_EMAIL = 'muhammadfadhilrandaputra@gmail.com';

function clean(value, max) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function parseEmails(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  const emails = [];
  for (const item of raw) {
    const email = String(item || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
    if (emails.length >= 25) break;
  }
  return emails;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const gmailUser = clean(process.env.GMAIL_USER, 200);
  const gmailPass = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');
  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ ok: false, error: 'Gmail is not configured on the server' });
  }

  const body = req.body || {};
  const jobTitle = clean(body.jobTitle, 200);
  const customerName = clean(body.customerName, 120);
  const customerEmail = clean(body.customerEmail, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const taskLink = clean(body.taskLink, 500);
  const txId = clean(body.txId, 40);
  const kind = body.kind === 'custom' ? 'Custom request' : 'Service order';
  const totalPrice = Math.max(0, Math.round(Number(body.totalPrice) || 0));

  if (!jobTitle || !customerName || !txId) {
    return res.status(400).json({ ok: false, error: 'Missing order details' });
  }

  const staff = parseEmails([
    ...(process.env.NOTIFY_EMAILS || '').split(','),
    ...(Array.isArray(body.recipients) ? body.recipients : []),
    ADMIN_EMAIL
  ]);
  const priceLabel = new Intl.NumberFormat('id-ID').format(totalPrice) + ' Rp';
  const customerLine = EMAIL_RE.test(customerEmail) ? customerEmail : '-';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass }
  });

  try {
    const staffBcc = staff.filter(email => email !== gmailUser.toLowerCase());
    await transporter.sendMail({
      from: `TJKTSS <${gmailUser}>`,
      to: gmailUser,
      ...(staffBcc.length ? { bcc: staffBcc.join(', ') } : {}),
      subject: `[TJKTSS] Pesanan baru: ${jobTitle}`,
      text: [
        'Pesanan baru masuk di TJKTSS.',
        '',
        `Jenis: ${kind}`,
        `ID: ${txId}`,
        `Judul: ${jobTitle}`,
        `Customer: ${customerName}`,
        `Email customer: ${customerLine}`,
        `Telepon / WhatsApp: ${phone || '-'}`,
        `Link tugas: ${taskLink || '-'}`,
        `Total: ${priceLabel}`
      ].join('\n')
    });

    if (EMAIL_RE.test(customerEmail) && !staff.includes(customerEmail)) {
      await transporter.sendMail({
        from: `TJKTSS <${gmailUser}>`,
        to: customerEmail,
        subject: `[TJKTSS] Pesanan diterima: ${jobTitle}`,
        text: [
          `Halo ${customerName},`,
          '',
          'Pesanan kamu sudah masuk dan menunggu pekerja.',
          '',
          `ID: ${txId}`,
          `Judul: ${jobTitle}`,
          `Total: ${priceLabel}`,
          `Telepon / WhatsApp: ${phone || '-'}`
        ].join('\n')
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Failed to send order email', error);
    return res.status(502).json({ ok: false, error: 'Could not send email' });
  }
}
