import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Hardcoded reward catalogue (in production this would be a DB table)
const CATALOGUE = [
  { id: 1, name: "Cult.fit — 1 month free",  category: "Fitness",  cost: 2000, icon: "🏋️" },
  { id: 2, name: "Amazon — ₹200 voucher",    category: "Shopping", cost: 1500, icon: "🛍️" },
  { id: 3, name: "Zomato — ₹100 off",        category: "Food",     cost: 800,  icon: "🍱" },
  { id: 4, name: "Audible — 1 month free",   category: "Learning", cost: 1000, icon: "🎧" },
  { id: 5, name: "Swiggy — ₹150 off",        category: "Food",     cost: 1200, icon: "🛵" },
  { id: 6, name: "Myntra — ₹300 voucher",    category: "Fashion",  cost: 1800, icon: "👗" },
];

// GET /api/rewards  — list all rewards with affordability flag
router.get('/', (req, res) => {
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);
  const rewards = CATALOGUE.map(r => ({ ...r, can_afford: user.coins >= r.cost }));
  res.json({ rewards, coins: user.coins });
});

// POST /api/rewards/redeem  — spend coins on a reward
router.post('/redeem', (req, res) => {
  const { reward_id } = req.body;
  const reward = CATALOGUE.find(r => r.id === reward_id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);
  if (user.coins < reward.cost) {
    return res.status(402).json({ error: 'Not enough coins', needed: reward.cost, have: user.coins });
  }

  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(reward.cost, req.user.id);
  const updated = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);

  res.json({ message: `Redeemed: ${reward.name}`, coins_spent: reward.cost, coins_remaining: updated.coins });
});

export default router;
