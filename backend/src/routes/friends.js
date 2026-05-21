import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/friends  — list accepted friends
router.get('/', (req, res) => {
  const userId = req.user.id;

  const friends = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.coins, u.streak,
           (
             SELECT COUNT(*) FROM habit_members hm1
             JOIN habit_members hm2 ON hm1.habit_id = hm2.habit_id
             WHERE hm1.user_id = ? AND hm2.user_id = u.id
           ) AS common_habits
    FROM users u
    JOIN friendships f ON (
      (f.requester = ? AND f.addressee = u.id) OR
      (f.addressee = ? AND f.requester = u.id)
    )
    WHERE f.status = 'accepted'
  `).all(userId, userId, userId);

  res.json({ friends });
});

// GET /api/friends/search?q=  — search users by name or email
router.get('/search', (req, res) => {
  const q = `%${req.query.q ?? ''}%`;
  const userId = req.user.id;

  const users = db.prepare(`
    SELECT id, name, email, avatar, coins, streak FROM users
    WHERE (name LIKE ? OR email LIKE ?) AND id != ?
    LIMIT 20
  `).all(q, q, userId);

  res.json({ users });
});

// POST /api/friends/request  — send a friend request
router.post('/request', (req, res) => {
  const { addressee_id } = req.body;
  if (!addressee_id) return res.status(400).json({ error: 'addressee_id is required' });
  if (addressee_id === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(addressee_id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  try {
    db.prepare('INSERT INTO friendships (requester, addressee) VALUES (?, ?)').run(req.user.id, addressee_id);
    res.status(201).json({ message: 'Friend request sent' });
  } catch {
    res.status(409).json({ error: 'Request already exists' });
  }
});

// POST /api/friends/accept  — accept a pending request
router.post('/accept', (req, res) => {
  const { requester_id } = req.body;
  if (!requester_id) return res.status(400).json({ error: 'requester_id is required' });

  const result = db.prepare(`
    UPDATE friendships SET status = 'accepted'
    WHERE requester = ? AND addressee = ? AND status = 'pending'
  `).run(requester_id, req.user.id);

  if (result.changes === 0) return res.status(404).json({ error: 'No pending request found' });
  res.json({ message: 'Friend request accepted' });
});

// DELETE /api/friends/:id  — remove a friend
router.delete('/:id', (req, res) => {
  const otherId = Number(req.params.id);
  const userId = req.user.id;

  db.prepare(`
    DELETE FROM friendships
    WHERE (requester = ? AND addressee = ?) OR (requester = ? AND addressee = ?)
  `).run(userId, otherId, otherId, userId);

  res.json({ message: 'Removed' });
});

// GET /api/friends/requests  — incoming pending requests
router.get('/requests', (req, res) => {
  const userId = req.user.id;

  const requests = db.prepare(`
    SELECT u.id, u.name, u.avatar, f.created_at FROM users u
    JOIN friendships f ON f.requester = u.id
    WHERE f.addressee = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(userId);

  res.json({ requests });
});

export default router;
