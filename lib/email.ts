import nodemailer from 'nodemailer'
import type { BookingDetails } from './googleCalendar'

// Escape user-supplied strings before embedding in HTML email bodies.
// Prevents XSS in email clients that render raw HTML.
function h(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

// Email to client confirming the booking
export async function sendClientConfirmation(booking: BookingDetails, calLink: string) {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"Luke Cuts PSU" <${process.env.SMTP_USER}>`,
    to: booking.email,
    subject: `✂ Appointment Confirmed — ${formatDate(booking.date)} at ${formatTime(booking.time)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="background:#090e0b;color:#e8f0eb;font-family:system-ui,sans-serif;margin:0;padding:0;">
        <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#5a9271;font-size:28px;font-weight:900;margin:0;">✂ Luke Cuts PSU</h1>
            <p style="color:#8aab97;margin:8px 0 0;">Your appointment is confirmed!</p>
          </div>

          <div style="background:#101a13;border:1px solid #1a2e21;border-radius:16px;padding:28px;margin-bottom:24px;">
            <h2 style="color:#fff;font-size:20px;margin:0 0 20px;">Booking Details</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#8aab97;padding:6px 0;width:100px;">Name</td><td style="color:#fff;font-weight:600;">${h(booking.name)}</td></tr>
              <tr><td style="color:#8aab97;padding:6px 0;">Service</td><td style="color:#5a9271;font-weight:600;">${h(booking.service)}</td></tr>
              <tr><td style="color:#8aab97;padding:6px 0;">Date</td><td style="color:#fff;font-weight:600;">${formatDate(booking.date)}</td></tr>
              <tr><td style="color:#8aab97;padding:6px 0;">Time</td><td style="color:#fff;font-weight:600;">${formatTime(booking.time)}</td></tr>
              ${booking.notes ? `<tr><td style="color:#8aab97;padding:6px 0;">Notes</td><td style="color:#fff;">${h(booking.notes)}</td></tr>` : ''}
            </table>
          </div>

          <div style="background:#0d1a12;border:1px solid #1a2e21;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="color:#fff;margin:0 0 8px;font-size:16px;">What to expect</h3>
            <ul style="color:#8aab97;margin:0;padding-left:20px;line-height:1.8;">
              <li>Luke will come to your location with all equipment</li>
              <li>Appointment lasts approximately 45 minutes</li>
              <li>You'll receive a reminder 24 hours before</li>
              <li>Need to reschedule? Reply to this email</li>
            </ul>
          </div>

          ${calLink ? `
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${calLink}" style="display:inline-block;background:#5a9271;color:#fff;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:600;font-size:15px;">
              Add to Google Calendar
            </a>
          </div>
          ` : ''}

          <p style="color:#4a6b55;text-align:center;font-size:13px;">
            Questions? Text or call <a href="tel:8145552887" style="color:#5a9271;">(814) 555-2887</a> or
            <a href="mailto:luke@lukecutspsu.com" style="color:#5a9271;">luke@lukecutspsu.com</a>
          </p>
        </div>
      </body>
      </html>
    `,
  })
}

// Email to Luke notifying him of a new booking
export async function sendOwnerNotification(booking: BookingDetails) {
  const transporter = getTransporter()
  const lukeEmail = process.env.LUKE_EMAIL ?? process.env.SMTP_USER

  await transporter.sendMail({
    from: `"Luke Cuts PSU Booking" <${process.env.SMTP_USER}>`,
    to: lukeEmail,
    subject: `📅 New Booking: ${booking.name} — ${formatDate(booking.date)} at ${formatTime(booking.time)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#090e0b;color:#e8f0eb;font-family:system-ui,sans-serif;padding:32px 24px;">
        <h2 style="color:#5a9271;">New Appointment Booked</h2>
        <table style="border-collapse:collapse;">
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Name</td><td style="color:#fff;font-weight:600;">${h(booking.name)}</td></tr>
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Phone</td><td><a href="tel:${h(booking.phone)}" style="color:#5a9271;">${h(booking.phone)}</a></td></tr>
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Email</td><td><a href="mailto:${h(booking.email)}" style="color:#5a9271;">${h(booking.email)}</a></td></tr>
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Service</td><td style="color:#fff;">${h(booking.service)}</td></tr>
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Date</td><td style="color:#fff;font-weight:600;">${formatDate(booking.date)}</td></tr>
          <tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Time</td><td style="color:#fff;font-weight:600;">${formatTime(booking.time)}</td></tr>
          ${booking.notes ? `<tr><td style="color:#8aab97;padding:5px 12px 5px 0;">Notes</td><td style="color:#fff;">${h(booking.notes)}</td></tr>` : ''}
        </table>
      </body>
      </html>
    `,
  })
}
