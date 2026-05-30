import { pool } from './db';

export type SecurityEventType =
  | 'register_success'
  | 'register_failed'
  | 'login_success'
  | 'login_failed'
  | 'google_login_success'
  | 'google_login_failed'
  | 'refresh_success'
  | 'refresh_failed'
  | 'logout'
  | 'logout_all'
  | 'logout_device'
  | 'email_verified'
  | 'email_verification_sent'
  | 'email_verification_failed'
  | 'password_reset_requested'
  | 'password_reset_request_failed'
  | 'password_reset_success'
  | 'password_reset_failed';

export async function insertSecurityAuditLog(params: {
  userId?: string | null;
  eventType: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await pool.query(
    `
    INSERT INTO "SecurityAuditLog"
      (user_id, event_type, ip_address, user_agent, metadata)
    VALUES
      ($1, $2, $3, $4, $5)
    `,
    [
      params.userId || null,
      params.eventType,
      params.ipAddress || null,
      params.userAgent || null,
      params.metadata || null,
    ],
  );
}
