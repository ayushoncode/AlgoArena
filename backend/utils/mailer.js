/**
 * utils/mailer.js
 * Sends transactional emails via Gmail SMTP (Nodemailer).
 * Falls back to console logging in dev when SMTP_USER / SMTP_PASS are not set.
 */

const nodemailer = require('nodemailer')

// Create a transporter lazily so we don't crash on startup if SMTP is not configured
let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const { SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_USER || !SMTP_PASS || SMTP_USER.startsWith('your_')) {
    return null // Not configured — fall back to console
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return _transporter
}

/**
 * Send a plain + HTML email.
 * Silently falls back to console.log if SMTP is not configured.
 * Returns { sent: true } on success, { sent: false, devOnly: true } on fallback.
 */
async function sendMail({ to, subject, text, html }) {
  const transporter = getTransporter()

  if (!transporter) {
    // Dev fallback — just log
    console.log(`\n📧 [MAIL FALLBACK — not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`)
    return { sent: false, devOnly: true }
  }

  const from = process.env.SMTP_FROM || `"AlgoArena" <${process.env.SMTP_USER}>`

  await transporter.sendMail({ from, to, subject, text, html })
  return { sent: true }
}

// ── Specific email templates ─────────────────────────────────

async function sendLoginOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `${otp} — Your AlgoArena Login Code`,
    text: `Your AlgoArena login code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.\n\n— AlgoArena`,
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#07080c;color:#dde1ea;border-radius:8px;border:1px solid #1e2130">
        <div style="margin-bottom:24px">
          <span style="color:#f97316;font-size:20px;font-weight:900">⚔ AlgoArena</span>
        </div>
        <h2 style="color:#dde1ea;margin:0 0 8px">Your Login Code</h2>
        <p style="color:#9ca3af;margin:0 0 24px;font-size:13px">Use this code to sign in to your AlgoArena account.</p>

        <div style="background:#111422;border:1px solid rgba(249,115,22,0.3);border-radius:6px;padding:20px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#f97316">${otp}</span>
        </div>

        <p style="color:#6b7280;font-size:12px;margin:0">⏱ Expires in <strong style="color:#dde1ea">5 minutes</strong>. Never share this code with anyone.</p>
        <p style="color:#374151;font-size:11px;margin:16px 0 0">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

async function sendPasswordResetOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `${otp} — Reset Your AlgoArena Password`,
    text: `Your AlgoArena password reset code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— AlgoArena`,
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#07080c;color:#dde1ea;border-radius:8px;border:1px solid #1e2130">
        <div style="margin-bottom:24px">
          <span style="color:#f97316;font-size:20px;font-weight:900">⚔ AlgoArena</span>
        </div>
        <h2 style="color:#dde1ea;margin:0 0 8px">Password Reset</h2>
        <p style="color:#9ca3af;margin:0 0 24px;font-size:13px">Use this code to reset your AlgoArena password.</p>

        <div style="background:#111422;border:1px solid rgba(34,211,238,0.3);border-radius:6px;padding:20px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#22d3ee">${otp}</span>
        </div>

        <p style="color:#6b7280;font-size:12px;margin:0">⏱ Expires in <strong style="color:#dde1ea">10 minutes</strong>. Never share this code with anyone.</p>
        <p style="color:#374151;font-size:11px;margin:16px 0 0">If you didn't request a password reset, ignore this email — your account is safe.</p>
      </div>
    `,
  })
}

async function sendEmailVerificationOtp(email, otp) {
  return sendMail({
    to: email,
    subject: `${otp} — Verify Your AlgoArena Email`,
    text: `Welcome to AlgoArena! Verify your email with this code: ${otp}\n\nExpires in 10 minutes.\n\n— AlgoArena`,
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#07080c;color:#dde1ea;border-radius:8px;border:1px solid #1e2130">
        <div style="margin-bottom:24px">
          <span style="color:#f97316;font-size:20px;font-weight:900">⚔ AlgoArena</span>
        </div>
        <h2 style="color:#dde1ea;margin:0 0 8px">Verify Your Email</h2>
        <p style="color:#9ca3af;margin:0 0 24px;font-size:13px">Welcome! Confirm your email address to activate your account.</p>

        <div style="background:#111422;border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:20px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#10b981">${otp}</span>
        </div>

        <p style="color:#6b7280;font-size:12px;margin:0">⏱ Expires in <strong style="color:#dde1ea">10 minutes</strong>.</p>
        <p style="color:#374151;font-size:11px;margin:16px 0 0">If you didn't create an AlgoArena account, ignore this email.</p>
      </div>
    `,
  })
}

module.exports = { sendMail, sendLoginOtp, sendPasswordResetOtp, sendEmailVerificationOtp }
