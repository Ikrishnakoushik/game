import { useState, useEffect, useRef } from "react";

const COLORS = {
  purple: "#6C5CE7",
  purpleLight: "#EEF0FF",
  purpleDark: "#4834D4",
  green: "#00B894",
  greenLight: "#E8FFF8",
  amber: "#FDCB6E",
  amberLight: "#FFF8E7",
  amberDark: "#E17055",
  teal: "#0984E3",
  tealLight: "#EBF5FF",
  red: "#E17055",
  redLight: "#FFF0ED",
  bg: "#F7F8FC",
  card: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#8892A4",
  border: "#E8ECF4",
};

const SAMPLE_FRIENDS = [
  { id: 1, name: "Arjun Joshi", username: "@arjun.j", coins: 980, avatar: "AJ", color: COLORS.tealLight, textColor: COLORS.teal, isConnected: true, commonHabits: 2 },
  { id: 2, name: "Priya Sharma", username: "@priya.s", coins: 920, avatar: "PS", color: COLORS.greenLight, textColor: COLORS.green, isConnected: true, commonHabits: 3 },
  { id: 3, name: "Nikhil M.", username: "@nikhil.m", coins: 760, avatar: "NM", color: COLORS.amberLight, textColor: COLORS.amberDark, isConnected: true, commonHabits: 1 },
  { id: 4, name: "Sree V.", username: "@sree.v", coins: 310, avatar: "SV", color: COLORS.redLight, textColor: COLORS.red, isConnected: true, commonHabits: 2 },
  { id: 5, name: "Akshay Kumar", username: "@akshay.k", coins: 1100, avatar: "AK", color: COLORS.purpleLight, textColor: COLORS.purple, isConnected: false, commonHabits: 0 },
  { id: 6, name: "Zara Khan", username: "@zara.khan", coins: 850, avatar: "ZK", color: "#FFE4E1", textColor: "#E91E63", isConnected: false, commonHabits: 0 },
];

const HABITS_INIT = [
  { id: 1, name: "Morning workout", days: 21, done: 14, mode: "coins", coinRate: 50, members: ["You","Arjun","Priya","Nikhil"], checkedToday: true, donateAmount: 0, charity: "" },
  { id: 2, name: "No social media after 9pm", days: 30, done: 12, mode: "donate", coinRate: 30, members: ["You","Sree","Vikram"], checkedToday: false, donateAmount: 15, charity: "Plant a Tree" },
  { id: 3, name: "Sleep before midnight", days: 30, done: 18, mode: "sub", coinRate: 100, members: ["You","Arjun","Priya","Nikhil","Sree"], checkedToday: true, donateAmount: 0, charity: "" },
];

const REWARDS = [
  { id: 1, name: "Cult.fit — 1 month free", category: "Fitness", cost: 2000, icon: "🏋️" },
  { id: 2, name: "Amazon — ₹200 voucher", category: "Shopping", cost: 1500, icon: "🛍️" },
  { id: 3, name: "Zomato — ₹100 off", category: "Food", cost: 800, icon: "🍱" },
  { id: 4, name: "Audible — 1 month free", category: "Learning", cost: 1000, icon: "🎧" },
  { id: 5, name: "Swiggy — ₹150 off", category: "Food", cost: 1200, icon: "🛵" },
  { id: 6, name: "Myntra — ₹300 voucher", category: "Fashion", cost: 1800, icon: "👗" },
];

const CHARITIES = [
  { id: 1, name: "Plant a Tree — GreenKarma", desc: "₹15 plants one tree", raised: 340, icon: "🌳" },
  { id: 2, name: "Child Education — Teach India", desc: "Funds rural school supplies", raised: 180, icon: "📚" },
  { id: 3, name: "Animal Shelter — PawCare", desc: "Feeds rescued street dogs", raised: 95, icon: "🐶" },
];

const LEADERBOARD = [
  { name: "You (Ravi)", streak: 15, coins: 1240, avatar: "RK", color: COLORS.purpleLight, textColor: COLORS.purple },
  { name: "Priya S.", streak: 14, coins: 980, avatar: "PS", color: COLORS.greenLight, textColor: COLORS.green },
  { name: "Nikhil M.", streak: 12, coins: 760, avatar: "NM", color: COLORS.amberLight, textColor: COLORS.amberDark },
  { name: "Arjun J.", streak: 9, coins: 520, avatar: "AJ", color: COLORS.tealLight, textColor: COLORS.teal },
  { name: "Sree V.", streak: 6, coins: 310, avatar: "SV", color: COLORS.redLight, textColor: COLORS.red },
];

const APP_TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "search", label: "Add friends", icon: "👥" },
  { id: "friends", label: "Friends", icon: "💬" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { id: "rewards", label: "Rewards", icon: "🎁" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "profile", label: "Profile", icon: "👤" },
];

function Avatar({ initials, color, textColor, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, color: textColor,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {initials}
    </div>
  );
}

function LandingPage({ onGetStarted }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", color: "#fff", textAlign: "center" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🪙</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, fontFamily: "'DM Serif Display', serif" }}>HabitCoins</h1>
      <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 24, maxWidth: 340, lineHeight: 1.6 }}>Build habits. Earn coins. Compete with friends. Do good. 100% legal in India.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        <button onClick={onGetStarted} style={{ padding: "14px 24px", borderRadius: 12, background: "#fff", color: COLORS.purple, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Get started 🚀</button>
        <button style={{ padding: "14px 24px", borderRadius: 12, background: "transparent", color: "#fff", border: "2px solid #fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Learn more</button>
      </div>
      <div style={{ marginTop: 40, fontSize: 12, opacity: 0.8 }}>✅ Legal • 🔒 Secure • 🌍 India-first</div>
    </div>
  );
}

function AuthScreen({ onAuthComplete, mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(mode === "login");

  const handleSubmit = () => {
    if (isLogin && email && password) {
      onAuthComplete({ name: "Ravi Kumar", email, avatar: "RK" });
    } else if (!isLogin && name && email && password) {
      onAuthComplete({ name, email, avatar: name.split(" ").map(n => n[0]).join("").toUpperCase() });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🪙</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, fontFamily: "'DM Serif Display', serif" }}>{isLogin ? "Welcome back" : "Join HabitCoins"}</h2>
          <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 6 }}>{isLogin ? "Sign in to your account" : "Start building better habits"}</p>
        </div>
        <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ravi Kumar"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.muted, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleSubmit} style={{ width: "100%", padding: "12px", borderRadius: 10, background: COLORS.purple, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
            {isLogin ? "Sign in" : "Create account"}
          </button>
          <div style={{ textAlign: "center", fontSize: 13, color: COLORS.muted }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} style={{ background: "none", border: "none", color: COLORS.purple, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ user, coins, isPro, habits, onLogout }) {
  const completedHabits = habits.filter(h => h.done === h.days).length;
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`, borderRadius: 16, padding: 24, color: "#fff", textAlign: "center", marginBottom: 16 }}>
        <Avatar initials={user.avatar} size={64} color="#fff" textColor={COLORS.purple} />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 12, fontFamily: "'DM Serif Display', serif" }}>{user.name}</h2>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{user.email}</p>
        {isPro && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "5px 12px", borderRadius: 99, display: "inline-block" }}>⭐ Pro member</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["🪙 Coins", coins.toLocaleString()], ["✅ Completed", completedHabits], ["🔥 Best streak", "15 days"]].map(([l, v], i) => (
          <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{l.split(" ")[0]}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginTop: 4, fontFamily: "'DM Serif Display', serif" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Account settings</div>
      {[["📝 Edit profile", "Update name, photo"], ["🔐 Privacy & security", "Manage permissions"], ["🔔 Notifications", "Customize alerts"], ["📊 Data & analytics", "View your stats"]].map(([label, desc], i) => (
        <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{desc}</div>
          </div>
          <span style={{ fontSize: 14, color: COLORS.muted }}>›</span>
        </div>
      ))}
      <button onClick={onLogout} style={{ width: "100%", padding: "12px", borderRadius: 10, background: COLORS.redLight, color: COLORS.red, border: `1px solid ${COLORS.red}60`, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>
        Sign out
      </button>
    </div>
  );
}

function SettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailUpdates: false,
    darkMode: false,
    showOnLeaderboard: true,
  });
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Notifications</div>
      {[["Push notifications", "App reminders for check-ins", "pushNotifications"], ["Email updates", "Weekly habit reports", "emailUpdates"]].map(([label, desc, key], i) => (
        <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{desc}</div>
          </div>
          <input type="checkbox" checked={settings[key]} onChange={() => setSettings({...settings, [key]: !settings[key]})} style={{ width: 18, height: 18, cursor: "pointer" }} />
        </div>
      ))}
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>Privacy</div>
      {[["Show on leaderboard", "Let friends see your rank", "showOnLeaderboard"]].map(([label, desc, key], i) => (
        <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{label}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{desc}</div>
          </div>
          <input type="checkbox" checked={settings[key]} onChange={() => setSettings({...settings, [key]: !settings[key]})} style={{ width: 18, height: 18, cursor: "pointer" }} />
        </div>
      ))}
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>Display</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>Dark mode</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>Coming soon</div>
        </div>
        <input type="checkbox" disabled style={{ width: 18, height: 18, cursor: "not-allowed", opacity: 0.5 }} />
      </div>
    </div>
  );
}

function SearchScreen({ friends }) {
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState(new Set());
  const filtered = SAMPLE_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id) => {
    const nc = new Set(connected);
    if (nc.has(id)) nc.delete(id); else nc.add(id);
    setConnected(nc);
  };
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ position: "sticky", top: 0, background: COLORS.bg, paddingBottom: 12, zIndex: 10 }}>
        <div style={{ display: "flex", gap: 8, background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "8px 12px", alignItems: "center" }}>
          <span style={{ fontSize: 16, color: COLORS.muted }}>🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or username..."
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: COLORS.text }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10, marginTop: 12 }}>Suggested friends</div>
      {filtered.map(f => (
        <div key={f.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={f.avatar} size={40} color={f.color} textColor={f.textColor} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{f.name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>{f.username} • 🪙 {f.coins.toLocaleString()} coins</div>
          </div>
          <button onClick={() => toggle(f.id)} style={{
            padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: connected.has(f.id) ? COLORS.greenLight : COLORS.purpleLight,
            color: connected.has(f.id) ? COLORS.green : COLORS.purple,
            border: `1px solid ${connected.has(f.id) ? COLORS.green + "60" : COLORS.purple + "60"}`,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {connected.has(f.id) ? "✓ Added" : "Add"}
          </button>
        </div>
      ))}
    </div>
  );
}

function HabitCard({ habit, onCheckin }) {
  const pct = Math.round((habit.done / habit.days) * 100);
  const barColor = habit.mode === "coins" ? COLORS.amber : habit.mode === "donate" ? COLORS.green : COLORS.purple;
  const modeStyles = {
    coins: { bg: COLORS.amberLight, color: "#92400E", label: "🪙 Coins" },
    donate: { bg: COLORS.greenLight, color: "#065F46", label: "💚 Donate" },
    sub: { bg: COLORS.purpleLight, color: COLORS.purple, label: "⭐ Pro" },
  };
  const m = modeStyles[habit.mode];
  return (
    <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: "14px 16px", marginBottom: 12 }}>
      <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, display: "inline-block", marginBottom: 8 }}>{m.label}</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{habit.name}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{habit.days}-day • {habit.members.length} members</div>
        </div>
        <span style={{ background: m.bg, color: m.color, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>
          {habit.mode === "coins" ? `+${habit.coinRate}` : habit.mode === "donate" ? `₹${habit.donateAmount}` : `+${habit.coinRate}`}
        </span>
      </div>
      <div style={{ height: 6, background: COLORS.bg, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex" }}>
          {habit.members.slice(0, 4).map((mem, i) => (
            <div key={i} style={{ marginLeft: i === 0 ? 0 : -6, border: `2px solid ${COLORS.card}`, borderRadius: "50%" }}>
              <Avatar initials={mem.slice(0, 2).toUpperCase()} size={20}
                color={[COLORS.purpleLight, COLORS.greenLight, COLORS.amberLight, COLORS.tealLight][i % 4]}
                textColor={[COLORS.purple, COLORS.green, COLORS.amberDark, COLORS.teal][i % 4]} />
            </div>
          ))}
          <span style={{ fontSize: 12, color: COLORS.muted, marginLeft: 8, alignSelf: "center" }}>{habit.done}/{habit.days}</span>
        </div>
        <button onClick={() => onCheckin(habit.id)} style={{
          padding: "6px 12px", borderRadius: 8,
          background: habit.checkedToday ? COLORS.greenLight : COLORS.bg,
          color: habit.checkedToday ? COLORS.green : COLORS.text,
          border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>
          {habit.checkedToday ? "✓ Done" : "Check in"}
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ habits, coins, onCheckin }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleDark})`, borderRadius: 16, padding: "16px 20px", marginBottom: 16, color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Your coins balance</div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'DM Serif Display', serif" }}>🪙 {coins.toLocaleString()}</div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Active challenges</div>
      {habits.map(h => <HabitCard key={h.id} habit={h} onCheckin={onCheckin} />)}
    </div>
  );
}

function FriendsScreen({ friends }) {
  const connected = friends.filter(f => f.isConnected);
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Connected ({connected.length})</div>
      {connected.map(f => (
        <div key={f.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <Avatar initials={f.avatar} size={40} color={f.color} textColor={f.textColor} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{f.name}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>🪙 {f.coins.toLocaleString()} coins • {f.commonHabits} shared habits</div>
            </div>
          </div>
          <button style={{ padding: "6px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", background: COLORS.bg, border: `1px solid ${COLORS.border}`, fontFamily: "'DM Sans', sans-serif" }}>Message</button>
        </div>
      ))}
    </div>
  );
}

function LeaderboardScreen() {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 12 }}>Global leaderboard</div>
      {LEADERBOARD.map((p, i) => (
        <div key={i} style={{ background: i === 0 ? COLORS.purpleLight : COLORS.card, border: `1px solid ${i === 0 ? COLORS.purple + "40" : COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20 }}>{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</div>
          <Avatar initials={p.avatar} size={36} color={p.color} textColor={p.textColor} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{p.name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>🔥 {p.streak} day streak</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, color: COLORS.purple, fontSize: 15 }}>🪙 {p.coins.toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RewardsScreen({ coins }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ background: COLORS.amberLight, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>Your balance</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#92400E", fontFamily: "'DM Serif Display', serif" }}>🪙 {coins.toLocaleString()}</div>
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Redeem rewards</div>
      {REWARDS.map(r => (
        <div key={r.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>{r.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{r.name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>{r.category}</div>
          </div>
          <button style={{ padding: "6px 12px", borderRadius: 8, background: coins >= r.cost ? COLORS.purpleLight : COLORS.bg, color: coins >= r.cost ? COLORS.purple : COLORS.muted, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            🪙 {r.cost}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function HabitCoinsApp() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [habits, setHabits] = useState(HABITS_INIT);
  const [coins, setCoins] = useState(1240);
  const [isPro, setIsPro] = useState(false);
  const [friends, setFriends] = useState(SAMPLE_FRIENDS.filter(f => f.isConnected));
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleGetStarted = () => setPage("auth");
  const handleAuthComplete = (userData) => { setUser(userData); setPage("app"); };
  const handleLogout = () => { setUser(null); setPage("landing"); };

  const handleCheckin = (id) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      if (!h.checkedToday) {
        const earned = isPro ? h.coinRate * 2 : h.coinRate;
        setCoins(c => c + earned);
        showToast(`+${earned} coins earned! 🪙`);
        return { ...h, checkedToday: true, done: Math.min(h.done + 1, h.days) };
      }
      return h;
    }));
  };

  if (page === "landing") return <LandingPage onGetStarted={handleGetStarted} />;
  if (page === "auth") return <AuthScreen onAuthComplete={handleAuthComplete} />;

  const screens = {
    home: <HomeScreen habits={habits} coins={coins} onCheckin={handleCheckin} />,
    search: <SearchScreen friends={friends} />,
    friends: <FriendsScreen friends={friends} />,
    leaderboard: <LeaderboardScreen />,
    rewards: <RewardsScreen coins={coins} />,
    settings: <SettingsScreen />,
    profile: <ProfileScreen user={user} coins={coins} isPro={isPro} habits={habits} onLogout={handleLogout} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>
        {toast && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: COLORS.text, color: "#fff", padding: "10px 20px", borderRadius: 99, fontSize: 13, fontWeight: 600, zIndex: 999, whiteSpace: "nowrap" }}>
            {toast}
          </div>
        )}
        <div style={{ background: COLORS.card, borderRadius: 20, border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${COLORS.border}`, scrollbarWidth: "none" }}>
            {APP_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: "0 0 auto", padding: "10px 12px", border: "none", background: "transparent",
                borderBottom: `2px solid ${tab === t.id ? COLORS.purple : "transparent"}`,
                color: tab === t.id ? COLORS.purple : COLORS.muted,
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
              }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: "16px 14px 20px", maxHeight: 560, overflowY: "auto" }}>
            {screens[tab]}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: COLORS.muted }}>
          ✅ Legal under India's Online Gaming Act 2025
        </div>
      </div>
    </div>
  );
}
