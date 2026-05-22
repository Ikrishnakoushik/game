import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/karmas  — all karmas the current user is a member of
router.get('/', (req, res) => {
  const userId = req.user.id;

  const karmas = db.prepare(`
    SELECT k.*,
           (SELECT COUNT(*) FROM checkins c
            WHERE c.karma_id = k.id AND c.user_id = ? AND c.date = date('now')) AS checked_today
    FROM karmas k
    JOIN karma_members km ON km.karma_id = k.id
    WHERE km.user_id = ?
    ORDER BY k.created_at DESC
  `).all(userId, userId);

  const withMembers = karmas.map(k => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.avatar FROM users u
      JOIN karma_members km ON km.user_id = u.id
      WHERE km.karma_id = ?
    `).all(k.id);
    return { ...k, members, checked_today: k.checked_today === 1 };
  });

  res.json({ karmas: withMembers });
});

// POST /api/karmas  — create a new karma
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { name, days = 30, mode = 'coins', coin_rate = 50, donate_amt = 0, charity = '' } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!['coins', 'donate', 'sub'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be coins, donate, or sub' });
  }

  const result = db.prepare(
    'INSERT INTO karmas (owner_id, name, days, mode, coin_rate, donate_amt, charity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, name, days, mode, coin_rate, donate_amt, charity);

  db.prepare('INSERT INTO karma_members (karma_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, userId);

  const karma = db.prepare('SELECT * FROM karmas WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ karma });
});

// POST /api/karmas/:id/checkin  — mark today's check-in
router.post('/:id/checkin', (req, res) => {
  const userId  = req.user.id;
  const karmaId = Number(req.params.id);

  const member = db.prepare('SELECT 1 FROM karma_members WHERE karma_id = ? AND user_id = ?').get(karmaId, userId);
  if (!member) return res.status(403).json({ error: 'Not a member of this karma' });

  const already = db.prepare(
    "SELECT id FROM checkins WHERE karma_id = ? AND user_id = ? AND date = date('now')"
  ).get(karmaId, userId);
  if (already) return res.status(409).json({ error: 'Already checked in today' });

  const karma = db.prepare('SELECT * FROM karmas WHERE id = ?').get(karmaId);
  const user  = db.prepare('SELECT is_pro FROM users WHERE id = ?').get(userId);
  const earned = user.is_pro ? karma.coin_rate * 2 : karma.coin_rate;

  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO checkins (karma_id, user_id, coins_earned) VALUES (?, ?, ?)').run(karmaId, userId, earned);
    db.prepare('UPDATE karmas SET done = MIN(done + 1, days) WHERE id = ?').run(karmaId);
    if (karma.mode === 'coins') {
      db.prepare('UPDATE users SET coins = coins + ?, streak = streak + 1 WHERE id = ?').run(earned, userId);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT coins, streak FROM users WHERE id = ?').get(userId);
  res.json({ coins_earned: earned, coins: updated.coins, streak: updated.streak });
});

// POST /api/karmas/:id/invite  — invite a friend (owner only)
router.post('/:id/invite', (req, res) => {
  const karmaId  = Number(req.params.id);
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const karma = db.prepare('SELECT owner_id FROM karmas WHERE id = ?').get(karmaId);
  if (!karma) return res.status(404).json({ error: 'Karma not found' });
  if (karma.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can invite' });

  try {
    db.prepare('INSERT INTO karma_members (karma_id, user_id) VALUES (?, ?)').run(karmaId, user_id);
    res.json({ message: 'Invited successfully' });
  } catch {
    res.status(409).json({ error: 'User is already a member' });
  }
});

// DELETE /api/karmas/:id  — delete a karma (owner only)
router.delete('/:id', (req, res) => {
  const karmaId = Number(req.params.id);
  const karma   = db.prepare('SELECT owner_id FROM karmas WHERE id = ?').get(karmaId);
  if (!karma) return res.status(404).json({ error: 'Karma not found' });
  if (karma.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete' });

  db.prepare('DELETE FROM karmas WHERE id = ?').run(karmaId);
  res.json({ message: 'Deleted' });
});

export default router;
