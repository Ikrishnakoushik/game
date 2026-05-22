# Razorpay Webhook Setup Guide

Razorpay needs to reach your backend server to confirm payments server-to-server.
During development your server runs on localhost — Razorpay can't reach that.
The fix is ngrok, which gives your localhost a public HTTPS URL.

---

## Step 1 — Install ngrok

Open a terminal and run:

```cmd
winget install ngrok.ngrok
```

Or download manually from https://ngrok.com/download (Windows ZIP, extract ngrok.exe anywhere).

---

## Step 2 — Create a free ngrok account

1. Go to https://dashboard.ngrok.com/signup (free)
2. After signup, go to https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy your authtoken

---

## Step 3 — Connect ngrok to your account

```cmd
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

---

## Step 4 — Start your backend server

In one terminal:
```cmd
cd "game project\backend"
node src/server.js
```

---

## Step 5 — Start ngrok tunnel

In a second terminal:
```cmd
ngrok http 3000
```

You will see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy that `https://abc123.ngrok-free.app` URL.

---

## Step 6 — Add webhook in Razorpay dashboard

1. Go to https://dashboard.razorpay.com/app/webhooks
2. Click **+ Add New Webhook**
3. Fill in:
   - **Webhook URL**: `https://abc123.ngrok-free.app/api/payments/webhook`
   - **Secret**: Create a strong random string (e.g. `openssl rand -hex 32`)
   - **Active Events**: tick `payment.captured` and `payment.failed`
4. Click **Save**

---

## Step 7 — Add webhook secret to your .env

```env
RAZORPAY_WEBHOOK_SECRET=the_secret_you_set_in_step_6
```

Restart your backend server after editing .env.

---

## Step 8 — Update Flutter app URL

In `habitcoins/lib/services/payment_service.dart`, change:
```dart
const String kBaseUrl = 'http://10.0.2.2:3000';
```
to your ngrok URL:
```dart
const String kBaseUrl = 'https://abc123.ngrok-free.app';
```

> Note: ngrok free tier gives a new URL every time you restart it.
> For a permanent URL, upgrade to ngrok paid or deploy to a server (see Production section below).

---

## Testing the webhook

After setup, make a test payment. You should see in your backend terminal:
```
Webhook fulfilled payment order_xxx for user 1
```

You can also test manually:
```cmd
curl -X POST https://abc123.ngrok-free.app/api/payments/webhook ^
  -H "Content-Type: application/json" ^
  -H "x-razorpay-signature: test" ^
  -d "{\"event\":\"payment.captured\"}"
```
(This will fail signature check — that's correct and expected.)

---

## Production deployment (when you're ready to go live)

Deploy your backend to any cloud server and you won't need ngrok anymore.

### Option A — Railway (easiest, free tier)
1. Go to https://railway.app
2. Connect your GitHub repo
3. Set environment variables in Railway dashboard
4. Your URL will be `https://yourapp.railway.app`
5. Set webhook URL to `https://yourapp.railway.app/api/payments/webhook`

### Option B — Render (free tier)
1. Go to https://render.com
2. New → Web Service → connect GitHub repo
3. Set root directory to `backend`
4. Start command: `node src/server.js`
5. Add environment variables
6. Your URL will be `https://yourapp.onrender.com`

### Option C — VPS (DigitalOcean / AWS / GCP)
1. Deploy backend to your server
2. Set up Nginx reverse proxy + SSL (Let's Encrypt)
3. Use your domain: `https://api.karmacoins.in`

### After deploying to production:
- Update `ALLOWED_ORIGINS` in .env to your app's domain
- Switch Razorpay from test keys to live keys
- Update Flutter `kBaseUrl` to your production URL
- Update Razorpay webhook URL to production URL

---

## Environment variables summary

```env
PORT=3000
JWT_SECRET=<long random string>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxx
ALLOWED_ORIGINS=https://yourapp.com
```
