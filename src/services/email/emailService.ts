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

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  await transporter.sendMail({
    from,
    to: params.to,
    subject: 'Восстановление пароля TiLern',
    text: `Сбросить пароль: ${params.resetUrl}`,
    html: `
      <h2>Восстановление пароля</h2>
      <p>Нажмите на ссылку, чтобы создать новый пароль:</p>
      <a href="${params.resetUrl}">${params.resetUrl}</a>
      <p>Если вы не запрашивали сброс пароля, просто игнорируйте это письмо.</p>
    `,
  });
}
