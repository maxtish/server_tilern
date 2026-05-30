import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = `"TiLern" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

export async function sendVerificationEmail(params: { to: string; verificationUrl: string }) {
  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Подтверждение email в TiLern',
    text: `Подтвердите email: ${params.verificationUrl}`,
    html: `
      <h2>Подтверждение email</h2>
      <p>Нажмите на ссылку, чтобы подтвердить email:</p>
      <a href="${params.verificationUrl}">${params.verificationUrl}</a>
    `,
  });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string; token: string }) {
  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Восстановление пароля TiLern',
    text: `
Восстановление пароля TiLern

Ваш token для сброса пароля:

${params.token}

Откройте приложение TiLern и вставьте этот token.

Ссылка для восстановления:
${params.resetUrl}

Если вы не запрашивали сброс пароля, просто игнорируйте это письмо.
    `,
    html: `
      <h2>Восстановление пароля TiLern</h2>

      <p>Ваш token для сброса пароля:</p>

      <div style="
        padding: 14px;
        background: #f2f2f2;
        border-radius: 8px;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1px;
        word-break: break-all;
      ">
        ${params.token}
      </div>

      <p>
        Откройте приложение TiLern и вставьте этот token.
      </p>

      <p>Ссылка для восстановления:</p>
      <a href="${params.resetUrl}">${params.resetUrl}</a>

      <p style="color: #777;">
        Если вы не запрашивали сброс пароля, просто игнорируйте это письмо.
      </p>
    `,
  });
}
