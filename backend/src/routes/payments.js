import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import db from '../db.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import {
  auditLog,
  checkIdempotency,
  detectSuspiciousActivity,
  validateAmount,
} from '../middleware/paymentSecurity.js';

const router = Router();

// ── Razorpay client ───────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_REPLACE_ME',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'REPLACE_ME',
});

// ── Coin packs catalogue (single source of truth — never trust client amounts) ─
export const COIN_PACKS = [
  { id: 'pack_500',  coins: 500,  price_paise: 4900,  label: '500 Coins',  tag: '' },
  { id: 'pack_1200', coins: 1200, price_paise: 9900,  label: '1200 Coins', tag: 'Popular' },
  { id: 'pack_2500', coins: 2500, price_paise: 19900, label: '2500 Coins', tag: 'Best Value' },
];

const PRO_PRICE_PAISE = 9900; // ₹99/month

// ── Schema (idempotency_key added) ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    razorpay_order_id   TEXT    NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    idempotency_key     TEXT,
    type                TEXT    NOT NULL,
    amount_paise        INTEGER NOT NULL,
    coins_granted       INTEGER NOT NULL DEFAULT 0,
    status              TEXT    NOT NULL DEFAULT 'created',
    ip                  TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id),
    status     TEXT    NOT NULL DEFAULT 'active',
    started_at TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT    NOT NULL
  );
`);

// ── GET /api/payments/packs ───────────────────────────────────────────────────
router.get('/packs', (req, res) => {
  const sub = db.prepare(`
    SELECT * FROM subscriptions
    WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
  `).get(req.user.id);

  res.json({
    coin_packs: COIN_PACKS.map(p => ({ ...p, price_inr: p.price_paise / 100 })),
    pro: {
      price_inr:  PRO_PRICE_PAISE / 100,
      is_active:  !!sub,
      expires_at: sub?.expires_at ?? null,
      perks: [
        '2× coins on every check-in',
        'Exclusive Pro badge',
        'Priority leaderboard',
        'Early access to rewards',
      ],
    },
  });
});

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Security layers: rate limit → suspicious activity → idempotency → amount validation
router.post('/create-order',
  paymentLimiter,
  detectSuspiciousActivity,
  checkIdempotency,
  async (req, res) => {
    const { type, pack_id } = req.body;

    // ── 1. Server-side amount validation (never trust client) ─────────────────
    const amount_paise = validateAmount(type, pack_id);
    if (amount_paise === null) {
      return res.status(400).json({ error: 'Invalid payment type or pack_id' });
    }

    const coins_granted = type === 'coins'
      ? COIN_PACKS.find(p => p.id === pack_id)?.coins ?? 0
      : 0;

    const receipt = `${type}_${req.user.id}_${Date.now()}`;

    auditLog(req.user.id, 'CREATE_ORDER_ATTEMPT', null, req,
      `type=${type} pack=${pack_id ?? 'pro'} amount=${amount_paise}`);

    try {
      // ── 2. Create order on Razorpay with server-validated amount ─────────────
      const order = await razorpay.orders.create({
        amount:   amount_paise,   // ← always from server catalogue, never from req.body
        currency: 'INR',
        receipt,
        notes: {
          user_id: String(req.user.id),
          type,
          pack_id: pack_id ?? '',
          server_validated: 'true',
        },
      });

      // ── 3. Persist pending order with IP for fraud tracking ───────────────────
      db.prepare(`
        INSERT INTO payments
          (user_id, razorpay_order_id, idempotency_key, type, amount_paise, coins_granted, status, ip)
        VALUES (?, ?, ?, ?, ?, ?, 'created', ?)
      `).run(
        req.user.id,
        order.id,
        req.idempotencyKey ?? null,
        type,
        amount_paise,
        coins_granted,
        req.ip,
      );

      auditLog(req.user.id, 'ORDER_CREATED', order.id, req);

      res.json({
        order_id: order.id,
        amount:   amount_paise,
        currency: 'INR',
        key_id:   process.env.RAZORPAY_KEY_ID || 'rzp_test_REPLACE_ME',
      });
    } catch (err) {
      auditLog(req.user.id, 'ORDER_FAILED', null, req, err.message);
      console.error('Razorpay order error:', err);
      res.status(502).json({ error: 'Payment gateway error. Please try again.' });
    }
  }
);

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Security layers: rate limit → HMAC signature → ownership → idempotency → fulfil
router.post('/verify',
  paymentLimiter,
  (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // ── 1. Input validation ───────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      auditLog(req.user.id, 'VERIFY_MISSING_FIELDS', razorpay_order_id, req);
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    // ── 2. Validate field formats (prevent injection) ─────────────────────────
    const idPattern = /^[a-zA-Z0-9_]+$/;
    if (!idPattern.test(razorpay_order_id) ||
        !idPattern.test(razorpay_payment_id) ||
        !/^[a-f0-9]+$/.test(razorpay_signature)) {
      auditLog(req.user.id, 'VERIFY_INVALID_FORMAT', razorpay_order_id, req);
      return res.status(400).json({ error: 'Invalid payment field format' });
    }

    // ── 3. HMAC-SHA256 signature verification (cryptographic proof from Razorpay) ─
    const secret   = process.env.RAZORPAY_KEY_SECRET || 'REPLACE_ME';
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(razorpay_signature, 'hex');

    const sigValid = expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!sigValid) {
      db.prepare("UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ?")
        .run(razorpay_order_id);
      auditLog(req.user.id, 'VERIFY_SIG_FAILED', razorpay_order_id, req);
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // ── 4. Fetch the pending order ────────────────────────────────────────────
    const payment = db.prepare(`
      SELECT * FROM payments WHERE razorpay_order_id = ? AND status = 'created'
    `).get(razorpay_order_id);

    if (!payment) {
      auditLog(req.user.id, 'VERIFY_ORDER_NOT_FOUND', razorpay_order_id, req);
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    // ── 5. Ownership check — order must belong to the authenticated user ──────
    if (payment.user_id !== req.user.id) {
      auditLog(req.user.id, 'VERIFY_OWNERSHIP_FAIL', razorpay_order_id, req,
        `order belongs to user ${payment.user_id}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    // ── 6. Re-validate amount against catalogue (prevent price tampering) ─────
    const expectedAmount = validateAmount(payment.type, payment.type === 'coins'
      ? COIN_PACKS.find(p => p.coins === payment.coins_granted)?.id
      : null);

    if (expectedAmount !== null && payment.amount_paise !== expectedAmount) {
      auditLog(req.user.id, 'VERIFY_AMOUNT_MISMATCH', razorpay_order_id, req,
        `stored=${payment.amount_paise} expected=${expectedAmount}`);
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    // ── 7. Fulfil atomically ──────────────────────────────────────────────────
    db.exec('BEGIN');
    try {
      db.prepare(`
        UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE id = ?
      `).run(razorpay_payment_id, payment.id);

      if (payment.type === 'coins') {
        db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?')
          .run(payment.coins_granted, payment.user_id);
      } else if (payment.type === 'pro') {
        db.prepare('UPDATE users SET is_pro = 1 WHERE id = ?').run(payment.user_id);
        db.prepare(`
          INSERT INTO subscriptions (user_id, status, expires_at)
          VALUES (?, 'active', datetime('now', '+30 days'))
          ON CONFLICT(user_id) DO UPDATE SET
            status     = 'active',
            expires_at = datetime('now', '+30 days'),
            started_at = datetime('now')
        `).run(payment.user_id);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      auditLog(req.user.id, 'VERIFY_FULFIL_ERROR', razorpay_order_id, req, err.message);
      throw err;
    }

    auditLog(req.user.id, 'PAYMENT_SUCCESS', razorpay_order_id, req,
      `type=${payment.type} coins=${payment.coins_granted}`);

    const updatedUser = db.prepare('SELECT coins, is_pro FROM users WHERE id = ?').get(req.user.id);
    res.json({
      success:     true,
      type:        payment.type,
      coins_added: payment.coins_granted,
      coins:       updatedUser.coins,
      is_pro:      updatedUser.is_pro === 1,
    });
  }
);

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Razorpay server-to-server webhook — independent of client, most secure path
// Set webhook URL in Razorpay dashboard: https://yourdomain.com/api/payments/webhook
// Set webhook secret in RAZORPAY_WEBHOOK_SECRET env var
router.post('/webhook',
  // Webhook uses raw body for signature verification — must be before json() middleware
  (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET not set — webhook ignored');
      return res.status(200).json({ status: 'ignored' });
    }

    const receivedSig = req.headers['x-razorpay-signature'];
    if (!receivedSig) return res.status(400).json({ error: 'Missing webhook signature' });

    // Verify webhook signature
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const sigBuf  = Buffer.from(receivedSig, 'hex');
    const expBuf  = Buffer.from(expectedSig, 'hex');
    const isValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event   = req.body.event;
    const payload = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && payload) {
      const orderId = payload.order_id;

      // Find the pending payment
      const payment = db.prepare(`
        SELECT * FROM payments WHERE razorpay_order_id = ? AND status = 'created'
      `).get(orderId);

      if (payment) {
        // Fulfil via webhook as a safety net (in case client verify call failed)
        db.exec('BEGIN');
        try {
          db.prepare(`UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE id = ?`)
            .run(payload.id, payment.id);

          if (payment.type === 'coins') {
            db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?')
              .run(payment.coins_granted, payment.user_id);
          } else if (payment.type === 'pro') {
            db.prepare('UPDATE users SET is_pro = 1 WHERE id = ?').run(payment.user_id);
            db.prepare(`
              INSERT INTO subscriptions (user_id, status, expires_at)
              VALUES (?, 'active', datetime('now', '+30 days'))
              ON CONFLICT(user_id) DO UPDATE SET
                status = 'active', expires_at = datetime('now', '+30 days'), started_at = datetime('now')
            `).run(payment.user_id);
          }
          db.exec('COMMIT');
          console.log(`Webhook fulfilled payment ${orderId} for user ${payment.user_id}`);
        } catch (err) {
          db.exec('ROLLBACK');
          console.error('Webhook fulfil error:', err);
        }
      }
    }

    if (event === 'payment.failed' && payload) {
      db.prepare("UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ?")
        .run(payload.order_id);
    }

    res.status(200).json({ status: 'ok' });
  }
);

// ── GET /api/payments/history ─────────────────────────────────────────────────
router.get('/history', (req, res) => {
  const rows = db.prepare(`
    SELECT id, type, amount_paise, coins_granted, status, created_at
    FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);

  res.json({ payments: rows.map(r => ({ ...r, amount_inr: r.amount_paise / 100 })) });
});

export default router;
