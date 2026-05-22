# KarmaCoins Backend API

Node.js + Express + SQLite (built-in `node:sqlite`, no native build needed).

## Requirements
- Node.js 24+

## Setup
```bash
npm install
cp .env.example .env   # edit JWT_SECRET before deploying
npm run dev            # development (auto-restarts on file change)
npm start              # production
```

Server starts on **http://localhost:3000**

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register — body: `{name, email, password}` |
| POST | `/api/auth/login`  | ❌ | Login — body: `{email, password}` |
| GET  | `/api/auth/me`     | ✅ | Current user profile |

Both signup and login return `{ token, user }`. Pass the token as:
```
Authorization: Bearer <token>
```

### Habits
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/habits`              | All habits you're a member of |
| POST   | `/api/habits`              | Create habit — `{name, days, mode, coin_rate, donate_amt, charity}` |
| POST   | `/api/habits/:id/checkin`  | Check in for today |
| POST   | `/api/habits/:id/invite`   | Invite user — `{user_id}` (owner only) |
| DELETE | `/api/habits/:id`          | Delete habit (owner only) |

`mode` values: `coins` | `donate` | `sub`

### Friends
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/friends`           | List accepted friends |
| GET    | `/api/friends/search?q=` | Search users by name/email |
| GET    | `/api/friends/requests`  | Incoming pending requests |
| POST   | `/api/friends/request`   | Send request — `{addressee_id}` |
| POST   | `/api/friends/accept`    | Accept request — `{requester_id}` |
| DELETE | `/api/friends/:id`       | Remove friend |

### Leaderboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leaderboard`        | Friends + self, ranked by coins |
| GET | `/api/leaderboard/global` | Top 20 globally |

### Rewards
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/rewards`        | Reward catalogue with affordability |
| POST | `/api/rewards/redeem` | Spend coins — `{reward_id}` |

### Payments (Razorpay)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/payments/packs`         | Coin packs + Pro plan info |
| POST | `/api/payments/create-order`  | Create Razorpay order — `{type, pack_id}` |
| POST | `/api/payments/verify`        | Verify payment signature & fulfil — `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` |
| GET  | `/api/payments/history`       | Last 20 payments for current user |

**Payment flow:**
1. App calls `POST /create-order` → gets `order_id` + `key_id`
2. App opens Razorpay checkout with those values
3. On success Razorpay returns `{order_id, payment_id, signature}`
4. App calls `POST /verify` → backend checks HMAC, credits coins or activates Pro

**Types:**
- `type: "coins"` + `pack_id: "pack_500"|"pack_1200"|"pack_2500"`
- `type: "pro"` (no pack_id needed)

**Setup:**
```bash
# Get free test keys from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```
Test cards: `4111 1111 1111 1111` · any future expiry · any CVV

---

## Database
SQLite file is created automatically at `backend/karmacoins.db` on first run.
Tables: `users`, `habits`, `habit_members`, `checkins`, `friendships`, `payments`, `subscriptions`
