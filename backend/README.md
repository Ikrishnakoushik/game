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

---

## Database
SQLite file is created automatically at `backend/KarmaCoins.db` on first run.
Tables: `users`, `habits`, `habit_members`, `checkins`, `friendships`
