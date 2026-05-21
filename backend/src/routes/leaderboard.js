import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/leaderboard  — top 20 users by coins (friends + self)
router.get('/', (req, res) => {
  const userId = req.user.id;

  const rows = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.coins, u.streak,
           RANK() OVER (ORDER BY u.coins DESC) AS rank
    FROM users u
    WHERE u.id = ?
       OR u.id IN (
         SELECT CASE WHEN f.requester = ? THEN f.addressee ELSE f.requester END
         FROM friendships f
         WHERE (f.requester = ? OR f.addressee = ?) AND f.status = 'accepted'
       )
    ORDER BY u.coins DESC
    LIMIT 20
  `).all(userId, userId, userId, userId);

  res.json({ leaderboard: rows });
});

// GET /api/leaderboard/global  — top 20 globally
router.get('/global', (req, res) => {
  const rows = db.prepare(`
    SELECT id, name, avatar, coins, streak,
           RANK() OVER (ORDER BY coins DESC) AS rank
    FROM users
    ORDER BY coins DESC
    LIMIT 20
  `).all();

  res.json({ leaderboard: rows });
});

export default router;
