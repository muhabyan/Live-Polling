# PulseLive — Real-Time Interactive Polling

PulseLive is a real-time audience engagement platform designed for seminars, conferences, and classrooms. It allows presenters to push interactive polls, word clouds, and Q&A to audience members' mobile devices instantly.

## Deployment Architecture

PulseLive is split into two components for production deployment:
1. **Frontend (Vercel)**: React + Vite SPA
2. **Backend (Render)**: Express API for moderator control, background timers, and AI Generation
3. **Database (Supabase)**: PostgreSQL + Realtime WebSockets

### Prerequisites

You need accounts on the following platforms:
1. [Supabase](https://supabase.com) (Free tier)
2. [Render](https://render.com) (Free tier)
3. [Vercel](https://vercel.com) (Free tier)
4. *(Optional)* [Groq](https://groq.com) (Free tier) - for AI features

---

## Deployment Guide

### Step 1: Supabase Setup

1. Create a new project in Supabase.
2. Go to **SQL Editor** in the Supabase dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` from this repository, paste it into the editor, and run it.
4. Open `supabase/migrations/002_enable_realtime.sql`, paste it, and run it.
5. Go to **Project Settings -> API** and copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Backend Deployment (Render)

1. Push your repository to GitHub.
2. In Render, create a new **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file and configure the service.
5. If it asks for Root Directory, set it to `backend`.
6. Add the following Environment Variables in Render:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret
   - `GROQ_API_KEY`: *(Optional)* Your Groq API Key
   - `FRONTEND_URL`: Leave blank for now, we will update this later.

### Step 3: Frontend Deployment (Vercel)

1. In Vercel, create a new **Project** and import your GitHub repository.
2. Set the **Framework Preset** to `Vite`.
3. Set the **Root Directory** to `frontend`.
4. Add the following Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key
   - `VITE_BACKEND_URL`: The URL of your Render backend (e.g., `https://pulselive-api.onrender.com`)
5. Click **Deploy**.

### Step 4: Final Connection

1. Once Vercel finishes deploying, copy your frontend URL (e.g., `https://pulselive.vercel.app`).
2. Go back to Render -> Your Web Service -> Environment.
3. Update `FRONTEND_URL` to your Vercel URL.
4. Restart the Render service.

---

## Local Development

To run the project locally on your machine:

1. Clone the repository.
2. Set up your Supabase database as described in Step 1.
3. Create `backend/.env` and add:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   GROQ_API_KEY=your-groq-key
   ```
4. Create `frontend/.env` and add:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_BACKEND_URL=http://localhost:3001
   ```
5. Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.
