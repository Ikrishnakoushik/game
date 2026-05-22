import { Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import db from '../db.js';

const router = Router();

// ── Razorpay client ───────────────────────────────────────────────────────────
// Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.
// Get keys from https://dashboard.razorpay.com/app/keys (test mode is free)
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_REPLACE_ME',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'REPLACE_ME',
});

// ── Coin packs catalogue ──────────────────────────────────────────────────────
export const COIN_PACKS = [
  { id: 'pack_500',  coins: 500,  price_paise: 4900,  label: '500 Coins',  tag: '' },
  { id: 'pack_1200', coins: 1200, price_paise: 9900,  label: '1200 Coins', tag: 'Popular' },
  { id: 'pack_2500', coins: 2500, price_paise: 19900, label: '2500 Coins', tag: 'Best Value' },
];

// Pro subscription price
const PRO_PRICE_PAISE = 9900; // ₹99/month

// ── Ensure payments table exists ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    razorpay_order_id   TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    type          TEXT NOT NULL,   -- 'coins' | 'pro'
    amount_paise  INTEGER NOT NULL,
    coins_granted INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'created', -- created | paid | failed
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id),
    status      TEXT NOT NULL DEFAULT 'active',  -- active | cancelled
    started_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL
  );
`);

// ── GET /api/payments/packs ───────────────────────────────────────────────────
// Returns coin packs + pro plan info
router.get('/packs', (req, res) => {
  const user = db.prepare('SELECT is_pro FROM users WHERE id = ?').get(req.user.id);
  const sub  = db.prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')").get(req.user.id);

  res.json({
    coin_packs: COIN_PACKS.map(p => ({ ...p, price_inr: p.price_paise / 100 })),
    pro: {
      price_inr: PRO_PRICE_PAISE / 100,
      is_active: !!sub,
      expires_at: sub?.expires_at ?? null,
      perks: ['2× coins on every check-in', 'Exclusive Pro badge', 'Priority leaderboard', 'Early access to rewards'],
    },
  });
});

// ── POST /api/payments/create-order ──────────────────────────────────────────
// Creates a Razorpay order and returns order_id to the app
router.post('/create-order', async (req, res) => {
  const { type, pack_id } = req.body; // type: 'coins' | 'pro'

  let amount_paise, coins_granted = 0, receipt;

  if (type === 'coins') {
    const pack = COIN_PACKS.find(p => p.id === pack_id);
    if (!pack) return res.status(400).json({ error: 'Invalid pack_id' });
    amount_paise  = pack.price_paise;
    coins_granted = pack.coins;
    receipt       = `coins_${req.user.id}_${Date.now()}`;
  } else if (type === 'pro') {
    amount_paise = PRO_PRICE_PAISE;
    receipt      = `pro_${req.user.id}_${Date.now()}`;
  } else {
    return res.status(400).json({ error: 'type must be coins or pro' });
  }

  try {
    const order = await razorpay.orders.create({
      amount:   amount_paise,
      currency: 'INR',
      receipt,
      notes: { user_id: String(req.user.id), type, pack_id: pack_id ?? '' },
    });

    // Persist the pending order
    db.prepare(`
      INSERT INTO payments (user_id, razorpay_order_id, type, amount_paise, coins_granted, status)
      VALUES (?, ?, ?, ?, ?, 'created')
    `).run(req.user.id, order.id, type, amount_paise, coins_granted);

    res.json({
      order_id:    order.id,
      amount:      amount_paise,
      currency:    'INR',
      key_id:      process.env.RAZORPAY_KEY_ID || 'rzp_test_REPLACE_ME',
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(502).json({ error: 'Payment gateway error' });
  }
});

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Called after successful payment on the app — verifies HMAC signature
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  // Verify HMAC-SHA256 signature
  const secret    = process.env.RAZORPAY_KEY_SECRET || 'REPLACE_ME';
  const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected  = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (expected !== razorpay_signature) {
    db.prepare("UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ?").run(razorpay_order_id);
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Fetch the pending payment record
  const payment = db.prepare("SELECT * FROM payments WHERE razorpay_order_id = ? AND status = 'created'").get(razorpay_order_id);
  if (!payment) return res.status(404).json({ error: 'Order not found or already processed' });

  // Verify the payment belongs to the authenticated user
  if (payment.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  // Apply rewards inside a transaction
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE id = ?")
      .run(razorpay_payment_id, payment.id);

    if (payment.type === 'coins') {
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(payment.coins_granted, payment.user_id);
    } else if (payment.type === 'pro') {
      db.prepare('UPDATE users SET is_pro = 1 WHERE id = ?').run(payment.user_id);
      // Upsert subscription — 30 days from now
      db.prepare(`
        INSERT INTO subscriptions (user_id, status, expires_at)
        VALUES (?, 'active', datetime('now', '+30 days'))
        ON CONFLICT(user_id) DO UPDATE SET
          status = 'active',
          expires_at = datetime('now', '+30 days'),
          started_at = datetime('now')
      `).run(payment.user_id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const user = db.prepare('SELECT coins, is_pro FROM users WHERE id = ?').get(req.user.id);
  res.json({
    success: true,
    type: payment.type,
    coins_added: payment.coins_granted,
    coins: user.coins,
    is_pro: user.is_pro === 1,
  });
});

// ── GET /api/payments/history ─────────────────────────────────────────────────
router.get('/history', (req, res) => {
  const rows = db.prepare(`
    SELECT id, type, amount_paise, coins_granted, status, created_at
    FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);

  res.json({ payments: rows.map(r => ({ ...r, amount_inr: r.amount_paise / 100 })) });
});

export default router;
