/**
 * utils/mailer.js
 * Sends transactional emails via Gmail SMTP (Nodemailer).
 * Falls back to console logging in dev when SMTP_USER / SMTP_PASS are not set.
 */

const nodemailer = require('nodemailer')
const crypto = require('crypto')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const { SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_USER || !SMTP_PASS || SMTP_USER.startsWith('your_')) {
    return null
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 3,
  })

  return _transporter
}

/**
 * Core send function with anti-spam headers.
 */
async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`\n📧 [MAIL FALLBACK — SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`)
    return { sent: false, devOnly: true }
  }

  const from = process.env.SMTP_FROM || `"AlgoArena" <${process.env.SMTP_USER}>`
  const messageId = `<${crypto.randomBytes(16).toString('hex')}@algoarena.dev>`

  await transporter.sendMail({
    from,
    to,
    replyTo: process.env.SMTP_USER,
    subject,
    text,
    html,
    // ── Anti-spam / deliverability headers ────────────────────
    headers: {
      'Message-ID': messageId,
      'X-Mailer': 'AlgoArena Mailer 1.0',
      'X-Entity-Ref-ID': crypto.randomBytes(8).toString('hex'),
      'Precedence': 'transactional',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      // Tell Gmail this is a priority transactional mail
      'X-Priority': '1',
      'Importance': 'High',
    },
    // Gmail will see text + html alternatives (better spam score)
    encoding: 'utf-8',
  })

  return { sent: true }
}

// ── Email HTML base template ──────────────────────────────────
function baseTemplate({ accentColor = '#f97316', badgeColor = '#f97316', codeBorderColor = 'rgba(249,115,22,0.35)', heading, subheading, otp, expiry, footer }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${heading} — AlgoArena</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#07080c;border-radius:10px;border:1px solid #1e2130;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 20px;border-bottom:1px solid #1e2130;">
              <span style="color:${accentColor};font-size:22px;font-weight:900;letter-spacing:-0.5px;">⚔ AlgoArena</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 0;">
              <h2 style="margin:0 0 6px;color:#dde1ea;font-size:20px;font-weight:800;">${heading}</h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;line-height:1.5;">${subheading}</p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111422;border:1px solid ${codeBorderColor};border-radius:8px;padding:22px;text-align:center;">
                    <span style="font-size:38px;font-weight:900;letter-spacing:12px;color:${badgeColor};font-family:'Courier New',monospace;">${otp}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
                ⏱ This code expires in <strong style="color:#dde1ea;">${expiry}</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e2130;padding-top:16px;">
                <tr>
                  <td style="color:#374151;font-size:11px;line-height:1.6;">
                    ${footer}<br/>
                    <span style="color:#1f2937;">You received this because someone used this email to sign in to AlgoArena. If this wasn't you, you can safely ignore this email.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Fine print -->
        <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;text-align:center;">
          AlgoArena &bull; 1v1 Competitive Coding &bull; Do not reply to this email
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Specific email senders ────────────────────────────────────

async function sendLoginOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `Your AlgoArena login code: ${otp}`,
    text: `Your AlgoArena sign-in code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it.\n\nIf you did not request this, ignore this email.\n\n— AlgoArena`,
    html: baseTemplate({
      accentColor: '#f97316',
      badgeColor: '#f97316',
      codeBorderColor: 'rgba(249,115,22,0.35)',
      heading: 'Your Sign-In Code',
      subheading: 'Use this one-time code to access your AlgoArena account.',
      otp,
      expiry: '5 minutes',
      footer: 'This is an automated security code for AlgoArena login.',
    }),
  })
}

async function sendEmailVerificationOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `Verify your AlgoArena account: ${otp}`,
    text: `Welcome to AlgoArena!\n\nYour email verification code is: ${otp}\n\nExpires in 10 minutes. Do not share it.\n\n— AlgoArena`,
    html: baseTemplate({
      accentColor: '#10b981',
      badgeColor: '#10b981',
      codeBorderColor: 'rgba(16,185,129,0.35)',
      heading: 'Verify Your Email',
      subheading: 'Welcome! Enter this code to complete your AlgoArena registration.',
      otp,
      expiry: '10 minutes',
      footer: 'You are receiving this because someone created an AlgoArena account with this email.',
    }),
  })
}

async function sendPasswordResetOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `Reset your AlgoArena password: ${otp}`,
    text: `Your AlgoArena password reset code is: ${otp}\n\nExpires in 10 minutes. Do not share it.\n\nIf you did not request a reset, ignore this email — your account is safe.\n\n— AlgoArena`,
    html: baseTemplate({
      accentColor: '#22d3ee',
      badgeColor: '#22d3ee',
      codeBorderColor: 'rgba(34,211,238,0.35)',
      heading: 'Password Reset Code',
      subheading: 'Use this code to set a new password for your AlgoArena account.',
      otp,
      expiry: '10 minutes',
      footer: 'You requested a password reset for your AlgoArena account.',
    }),
  })
}

module.exports = { sendMail, sendLoginOtp, sendPasswordResetOtp, sendEmailVerificationOtp }
