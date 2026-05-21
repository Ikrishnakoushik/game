import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/habits  — all habits the current user is a member of
router.get('/', (req, res) => {
  const userId = req.user.id;

  const habits = db.prepare(`
    SELECT h.*,
           (SELECT COUNT(*) FROM checkins c WHERE c.habit_id = h.id AND c.user_id = ? AND c.date = date('now')) AS checked_today
    FROM habits h
    JOIN habit_members hm ON hm.habit_id = h.id
    WHERE hm.user_id = ?
    ORDER BY h.created_at DESC
  `).all(userId, userId);

  // Attach member list to each habit
  const withMembers = habits.map(h => {
    const members = db.prepare(`
      SELECT u.id, u.name, u.avatar FROM users u
      JOIN habit_members hm ON hm.user_id = u.id
      WHERE hm.habit_id = ?
    `).all(h.id);
    return { ...h, members, checked_today: h.checked_today === 1 };
  });

  res.json({ habits: withMembers });
});

// POST /api/habits  — create a new habit
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { name, days = 30, mode = 'coins', coin_rate = 50, donate_amt = 0, charity = '' } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!['coins', 'donate', 'sub'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be coins, donate, or sub' });
  }

  const result = db.prepare(
    'INSERT INTO habits (owner_id, name, days, mode, coin_rate, donate_amt, charity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, name, days, mode, coin_rate, donate_amt, charity);

  // Owner is automatically a member
  db.prepare('INSERT INTO habit_members (habit_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, userId);

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ habit });
});

// POST /api/habits/:id/checkin  — mark today's check-in
router.post('/:id/checkin', (req, res) => {
  const userId = req.user.id;
  const habitId = Number(req.params.id);

  // Verify user is a member
  const member = db.prepare('SELECT 1 FROM habit_members WHERE habit_id = ? AND user_id = ?').get(habitId, userId);
  if (!member) return res.status(403).json({ error: 'Not a member of this habit' });

  // Check already checked in today
  const already = db.prepare(
    "SELECT id FROM checkins WHERE habit_id = ? AND user_id = ? AND date = date('now')"
  ).get(habitId, userId);
  if (already) return res.status(409).json({ error: 'Already checked in today' });

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(habitId);
  const user = db.prepare('SELECT is_pro FROM users WHERE id = ?').get(userId);
  const earned = user.is_pro ? habit.coin_rate * 2 : habit.coin_rate;

  // Run check-in steps inside a manual transaction
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO checkins (habit_id, user_id, coins_earned) VALUES (?, ?, ?)').run(habitId, userId, earned);
    db.prepare('UPDATE habits SET done = MIN(done + 1, days) WHERE id = ?').run(habitId);
    if (habit.mode === 'coins') {
      db.prepare('UPDATE users SET coins = coins + ?, streak = streak + 1 WHERE id = ?').run(earned, userId);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updatedUser = db.prepare('SELECT coins, streak FROM users WHERE id = ?').get(userId);
  res.json({ coins_earned: earned, coins: updatedUser.coins, streak: updatedUser.streak });
});

// POST /api/habits/:id/invite  — invite a friend by user id
router.post('/:id/invite', (req, res) => {
  const habitId = Number(req.params.id);
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  // Only owner can invite
  const habit = db.prepare('SELECT owner_id FROM habits WHERE id = ?').get(habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  if (habit.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can invite' });

  try {
    db.prepare('INSERT INTO habit_members (habit_id, user_id) VALUES (?, ?)').run(habitId, user_id);
    res.json({ message: 'Invited successfully' });
  } catch {
    res.status(409).json({ error: 'User is already a member' });
  }
});

// DELETE /api/habits/:id  — delete a habit (owner only)
router.delete('/:id', (req, res) => {
  const habitId = Number(req.params.id);
  const habit = db.prepare('SELECT owner_id FROM habits WHERE id = ?').get(habitId);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  if (habit.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can delete' });

  db.prepare('DELETE FROM habits WHERE id = ?').run(habitId);
  res.json({ message: 'Deleted' });
});

export default router;
