require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Gmail transporter ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((err) => {
  if (err) console.error('❌ SMTP connection failed:', err.message);
  else     console.log('✅ Gmail SMTP ready');
});

// ── Google Sheets helper ───────────────────────────────────────
async function appendToSheet(row) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}

// ── POST /apply ────────────────────────────────────────────────
app.post('/apply', async (req, res) => {
  const { firstName, lastName, email, ageRange, address, state, country } = req.body;

  if (!firstName || !lastName || !email || !ageRange) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const submittedAt = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }) + ' WAT';

  try {
    // 1. Append row to Google Sheet
    await appendToSheet([
      firstName,
      lastName,
      email,
      ageRange,
      address || '—',
      state   || '—',
      country || 'Nigeria',
      submittedAt,
    ]);
    console.log(`📊 Sheet updated — ${firstName} ${lastName}`);
  } catch (sheetErr) {
    // Log but don't block the emails if sheet fails
    console.error('⚠️  Google Sheets error:', sheetErr.message);
  }

  try {
    // 2. Notify the Venix team
    await transporter.sendMail({
      from: `"Venix NextGen Applications" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.GMAIL_USER,
      subject: `📬 New Application — ${firstName} ${lastName}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0d0d0f;color:#e8e8e8;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a56db,#0ea5e9);padding:32px 40px;">
            <h1 style="margin:0;font-size:24px;color:#fff;">New Application Received</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Venix NextGen Initiative</p>
          </div>
          <div style="padding:32px 40px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;width:40%;">Full Name</td>
                  <td style="padding:10px 0;font-weight:600;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">Email</td>
                  <td style="padding:10px 0;border-top:1px solid #222;"><a href="mailto:${email}" style="color:#38bdf8;">${email}</a></td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">Age Range</td>
                  <td style="padding:10px 0;border-top:1px solid #222;">${ageRange}</td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">Address</td>
                  <td style="padding:10px 0;border-top:1px solid #222;">${address || '—'}</td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">State</td>
                  <td style="padding:10px 0;border-top:1px solid #222;">${state || '—'}</td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">Country</td>
                  <td style="padding:10px 0;border-top:1px solid #222;">${country || 'Nigeria'}</td></tr>
              <tr><td style="padding:10px 0;color:#8899aa;font-size:13px;border-top:1px solid #222;">Submitted</td>
                  <td style="padding:10px 0;border-top:1px solid #222;">${submittedAt}</td></tr>
            </table>
          </div>
        </div>
      `,
    });

    // 3. Confirmation email to applicant
    await transporter.sendMail({
      from: `"Venix NextGen Initiative" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✅ We received your application, ${firstName}!`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#0d0d0f;color:#e8e8e8;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1a56db,#0ea5e9);padding:32px 40px;">
            <h1 style="margin:0;font-size:24px;color:#fff;">Application Received!</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Venix NextGen Initiative</p>
          </div>
          <div style="padding:32px 40px;">
            <p style="font-size:16px;line-height:1.6;">Hi <strong>${firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.7;color:#bcc8d4;">
              Thank you for applying to the Venix NextGen Initiative. We've received your application and our team will review it shortly.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#bcc8d4;">
              We'll be in touch with next steps within <strong style="color:#e8e8e8;">2–3 business days</strong>.
            </p>
            <div style="margin:28px 0;padding:20px 24px;background:#161820;border-left:3px solid #1a56db;border-radius:6px;">
              <p style="margin:0;font-size:13px;color:#8899aa;">Your submission</p>
              <p style="margin:6px 0 0;font-size:15px;font-weight:600;">${firstName} ${lastName} · ${ageRange} · ${state || country || 'Nigeria'}</p>
            </div>
            <p style="font-size:14px;color:#8899aa;">Questions? Reach us at <a href="mailto:venixnextgen@gmail.com" style="color:#38bdf8;">venixnextgen@gmail.com</a></p>
          </div>
          <div style="padding:0 40px 32px;border-top:1px solid #1a1e2a;">
            <p style="margin:24px 0 0;font-size:12px;color:#445566;">© 2025 Venix NextGen Initiative · Lagos, Nigeria 🇳🇬</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

app.listen(PORT, () => console.log(`🚀 Venix backend running on port ${PORT}`));