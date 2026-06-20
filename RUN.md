# TrackYT — How to Run

## Prerequisites

- **Node.js** v18+ installed ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

---

## 1. Get Your Free API Keys

### MongoDB Atlas (Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a **free M0 cluster** (choose any region)
3. Create a database user (username + password)
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere)
5. Go to **Database** → Click **Connect** → Choose **Drivers** → Copy the connection string
6. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/trackyt?retryWrites=true&w=majority`

### YouTube Data API v3 (Channel Data)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Go to **APIs & Services** → **Library**
4. Search for **YouTube Data API v3** → Enable it
5. Go to **Credentials** → **Create Credentials** → **API Key**
6. Copy the API key

### Google Gemini API (AI Summaries)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API Key** → **Create API Key**
3. Copy the API key

> All three services are **100% free** within their free tiers.

---

## 2. Configure Environment Variables

```bash
# From the project root
cp .env.example server/.env
```

Edit `server/.env` and fill in your keys:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/trackyt?retryWrites=true&w=majority
JWT_SECRET=generate-a-random-64-character-string-here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
YOUTUBE_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

> **Tip:** Generate a JWT secret by running:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

## 4. Run the Project

Open **two terminal windows**:

### Terminal 1 — Backend (Express API + Cron)

```bash
cd server
npm run dev
```

You should see:

```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 TrackYT server running on port 5000
📅 Cron scheduler started: "0 * * * *" (every hour)
```

### Terminal 2 — Frontend (React + Vite)

```bash
cd client
npm run dev
```

You should see:

```
  VITE v8.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

---

## 5. Open the App

Go to **http://localhost:5173** in your browser.

1. **Sign up** for a new account
2. **Add a channel** (e.g., `https://youtube.com/@MrBeast`)
3. The system will take an initial snapshot
4. Changes will be detected every hour by the cron job
5. View your **Dashboard**, **Timeline**, **Analytics**, and **AI Summaries**

---

## Available Scripts

### Backend (`server/`)

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start server with auto-reload (node --watch) |
| `npm start` | Start server for production |

### Frontend (`client/`)

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## API Health Check

Once the backend is running, visit:

```
http://localhost:5000/api/health
```

You should see:

```json
{
  "status": "ok",
  "timestamp": "2026-06-20T01:00:00.000Z",
  "uptime": 42.5
}
```

---

## Troubleshooting

| Problem | Solution |
|:--------|:---------|
| `MongoDB connection failed` | Check your `MONGODB_URI` in `.env`. Make sure network access allows `0.0.0.0/0`. |
| `YouTube API quota exceeded` | You have 10,000 units/day. Adding channels uses 100 units each. Wait until quota resets at midnight PT. |
| `Gemini API 429 error` | Free tier rate limit hit. The system will use fallback template summaries automatically. |
| `Port 5000 already in use` | Change `PORT` in `.env` or kill the process using port 5000. |
| `CORS errors in browser` | Make sure `CLIENT_URL` in `.env` matches your frontend URL (`http://localhost:5173`). |

---

## Project Structure

```
trackyt/
├── client/                  ← React Frontend (Vite + Tailwind v4)
│   ├── src/
│   │   ├── components/      ← Reusable UI components
│   │   ├── contexts/        ← React Context (Auth)
│   │   ├── pages/           ← 9 route-level pages
│   │   ├── services/        ← Axios API wrappers
│   │   ├── utils/           ← Formatters, helpers
│   │   ├── App.jsx          ← Root component + Router
│   │   ├── main.jsx         ← Entry point
│   │   └── index.css        ← Design system
│   └── package.json
│
├── server/                  ← Express Backend
│   ├── config/              ← DB connection
│   ├── controllers/         ← Route handlers
│   ├── jobs/                ← Cron jobs
│   ├── middlewares/         ← Auth, errors, rate limiting
│   ├── models/              ← Mongoose schemas
│   ├── routes/              ← API route definitions
│   ├── services/            ← Business logic
│   ├── utils/               ← Logger, constants, validators
│   ├── server.js            ← Entry point
│   └── package.json
│
├── .env.example             ← Environment variable template
├── .gitignore
├── CHECKLIST.md             ← Master progress checklist
└── RUN.md                   ← This file
```
