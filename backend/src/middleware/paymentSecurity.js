import db from '../db.js';

// ── Ensure audit_log table exists ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS payment_audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    action     TEXT    NOT NULL,
    order_id   TEXT,
    ip         TEXT,
    user_agent TEXT,
    detail     TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Audit logger ──────────────────────────────────────────────────────────────
export function auditLog(userId, action, orderId, req, detail = '') {
  try {
    db.prepare(`
      INSERT INTO payment_audit_log (user_id, action, order_id, ip, user_agent, detail)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId ?? null,
      action,
      orderId ?? null,
      req.ip,
      req.headers['user-agent'] ?? '',
      detail,
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// ── Idempotency check ─────────────────────────────────────────────────────────
// Prevents double-charging if the app retries a create-order call
export function checkIdempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // optional header — skip if not sent

  const existing = db.prepare(`
    SELECT razorpay_order_id, status FROM payments
    WHERE user_id = ? AND idempotency_key = ?
  `).get(req.user.id, key);

  if (existing) {
    // Return the already-created order instead of creating a new one
    return res.json({
      order_id: existing.razorpay_order_id,
      idempotent: true,
      status: existing.status,
    });
  }

  req.idempotencyKey = key;
  next();
}

// ── Suspicious activity detector ─────────────────────────────────────────────
// Blocks if user created 5+ orders in the last 5 minutes
export function detectSuspiciousActivity(req, res, next) {
  const recentCount = db.prepare(`
    SELECT COUNT(*) AS cnt FROM payments
    WHERE user_id = ? AND created_at > datetime('now', '-5 minutes')
  `).get(req.user.id)?.cnt ?? 0;

  if (recentCount >= 5) {
    auditLog(req.user.id, 'BLOCKED_SUSPICIOUS', null, req,
      `${recentCount} orders in 5 min`);
    return res.status(429).json({
      error: 'Unusual activity detected. Please wait a few minutes before trying again.',
    });
  }
  next();
}

// ── Server-side amount validation ─────────────────────────────────────────────
// Ensures the amount we charge matches our catalogue — client value is ignored
import { COIN_PACKS } from '../routes/payments.js';

const PRO_PRICE_PAISE = 9900;

export function validateAmount(type, packId) {
  if (type === 'pro') return PRO_PRICE_PAISE;
  if (type === 'coins') {
    const pack = COIN_PACKS.find(p => p.id === packId);
    if (!pack) return null;
    return pack.price_paise;
  }
  return null;
}
