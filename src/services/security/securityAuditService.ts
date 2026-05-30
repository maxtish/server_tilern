import { insertSecurityAuditLog, SecurityEventType } from '../../db/securityAuditDB';

export async function logSecurityEvent(params: {
  userId?: string | null;
  eventType: SecurityEventType;
  ipAddress?: string | null;
  userAgent?: string | string[] | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await insertSecurityAuditLog({
      userId: params.userId || null,
      eventType: params.eventType,
      ipAddress: params.ipAddress || null,
      userAgent: normalizeHeader(params.userAgent),
      metadata: params.metadata || null,
    });
  } catch (err) {
    console.error('Security audit log failed:', err);
  }
}

function normalizeHeader(value?: string | string[] | null): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}
