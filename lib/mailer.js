const nodemailer = require('nodemailer');

// Configure transporter — set these in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@peritoprofessionalperformance.nl';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@perito.website';

/**
 * Send contact form email to support
 */
async function sendContactEmail({ naam, email, onderwerp, vraag }) {
  // Email to support team
  await transporter.sendMail({
    from: `"Perito Support Portal" <${FROM_EMAIL}>`,
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `[Support Portal] ${onderwerp || 'Nieuwe vraag'} — ${naam}`,
    text: `Nieuwe vraag via het support portaal:\n\nNaam: ${naam}\nE-mail: ${email}\nOnderwerp: ${onderwerp || 'Niet opgegeven'}\n\nVraag:\n${vraag}`,
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3290ce; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Nieuwe vraag via Support Portal</h2>
        </div>
        <div style="padding: 24px; background: #f9f9f9;">
          <p><strong>Naam:</strong> ${escapeHtml(naam)}</p>
          <p><strong>E-mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Onderwerp:</strong> ${escapeHtml(onderwerp || 'Niet opgegeven')}</p>
          <hr style="border: 1px solid #ddd;">
          <p><strong>Vraag:</strong></p>
          <p>${escapeHtml(vraag).replace(/\n/g, '<br>')}</p>
        </div>
        <div style="height: 4px; background: linear-gradient(to right, #3290ce, #02799f, #933034, #ea1d23, #f16529);"></div>
      </div>
    `
  });

  // Confirmation email to sender
  await transporter.sendMail({
    from: `"Perito Support" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Wij hebben uw vraag ontvangen — Perito Support',
    text: `Beste ${naam},\n\nBedankt voor uw bericht. Wij hebben uw vraag ontvangen en proberen deze zo snel mogelijk te beantwoorden.\n\nUw vraag:\n${vraag}\n\nMet vriendelijke groet,\nPerito Professional Performance Support`,
    html: `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3290ce; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Bedankt voor uw bericht</h2>
        </div>
        <div style="padding: 24px;">
          <p>Beste ${escapeHtml(naam)},</p>
          <p>Wij hebben uw vraag ontvangen en proberen deze zo snel mogelijk te beantwoorden.</p>
          <p style="background: #f5f5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #3290ce;">
            <strong>Uw vraag:</strong><br>
            ${escapeHtml(vraag).replace(/\n/g, '<br>')}
          </p>
          <p>Met vriendelijke groet,<br><strong>Perito Professional Performance Support</strong></p>
        </div>
        <div style="height: 4px; background: linear-gradient(to right, #3290ce, #02799f, #933034, #ea1d23, #f16529);"></div>
      </div>
    `
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendContactEmail };
