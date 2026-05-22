import rateLimit from 'express-rate-limit';

// ── General API limiter — 100 req/min per IP ──────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// ── Payment endpoints — 10 req/min per IP (strict) ───────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please wait before trying again.' },
  keyGenerator: (req) => req.user?.id
    ? `user_${req.user.id}`   // per-user limit when authenticated
    : req.ip,                 // per-IP fallback
});

// ── Auth endpoints — 20 req/15min per IP (prevent brute-force) ───────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});
