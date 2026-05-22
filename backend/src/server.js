import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireAuth } from './middleware/auth.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

import authRoutes     from './routes/auth.js';
import karmaRoutes    from './routes/karmas.js';
import friendRoutes   from './routes/friends.js';
import leaderRoutes   from './routes/leaderboard.js';
import rewardRoutes   from './routes/rewards.js';
import paymentRoutes  from './routes/payments.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow local network in dev, restrict in production ────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return cb(null, true);
    // Allow all in dev (*), or check whitelist in prod
    if (ALLOWED_ORIGINS.includes('*')) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

// ── Webhook route needs raw body BEFORE json() middleware ─────────────────────
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    // Parse raw buffer back to object for the route handler
    if (Buffer.isBuffer(req.body)) {
      try { req.body = JSON.parse(req.body.toString()); } catch { req.body = {}; }
    }
    next();
  },
  paymentRoutes,
);

// ── Body parser — 50kb limit prevents large payload attacks ───────────────────
app.use(express.json({ limit: '50kb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}  ${req.ip}`);
  next();
});

// ── Public routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);

// ── Protected routes ──────────────────────────────────────────────────────────
app.use('/api/karmas',      requireAuth, karmaRoutes);
app.use('/api/friends',     requireAuth, friendRoutes);
app.use('/api/leaderboard', requireAuth, leaderRoutes);
app.use('/api/rewards',     requireAuth, rewardRoutes);
app.use('/api/payments',    requireAuth, paymentRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  // Never leak stack traces to clients
  res.status(500).json({ error: 'Internal server error' });
});

import { networkInterfaces } from 'node:os';

app.listen(PORT, '0.0.0.0', () => {
  // Find local WiFi IP so you know what to put in kBaseUrl
  const nets = networkInterfaces();
  let lanIp = 'unknown';
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
  }
  console.log(`\n🪙  KarmaCoins API running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${lanIp}:${PORT}  ← use this in Flutter kBaseUrl\n`);
});
