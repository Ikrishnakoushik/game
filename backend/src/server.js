import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';

import authRoutes     from './routes/auth.js';
import habitRoutes    from './routes/habits.js';
import friendRoutes   from './routes/friends.js';
import leaderRoutes   from './routes/leaderboard.js';
import rewardRoutes   from './routes/rewards.js';
import paymentRoutes  from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Auth: /signup and /login are public; /me requires a token
app.use('/api/auth', authRoutes);

// All other API routes require a valid JWT
app.use('/api/habits',      requireAuth, habitRoutes);
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
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🪙  KarmaCoins API running on http://localhost:${PORT}\n`);
});
