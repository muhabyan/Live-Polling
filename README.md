# PulseLive — Real-Time Interactive Polling

PulseLive is a real-time audience engagement platform designed for seminars, conferences, and classrooms. It allows presenters to push interactive polls, word clouds, and Q&A to audience members' mobile devices instantly.

## 🚀 100% Free Deployment (Vercel + Supabase)

No credit card required.

### Prerequisites

You need accounts on:
1. [Supabase](https://supabase.com) (Free tier)
2. [Vercel](https://vercel.com) (Free tier)
3. *(Optional)* [Groq](https://groq.com) (Free tier) - for AI features

---

## 📖 Deployment Guide

### Step 1: Supabase Setup (Already Done)
1. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.
2. Run `supabase/migrations/002_enable_realtime.sql` in Supabase SQL Editor.
3. In **Project Settings -> API**, copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

### Step 2: Deploy to Vercel (All-in-One)
1. Open [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** ➡️ **Project**.
3. Import your repository: `Live-Polling`.
4. Framework Preset: **Vite** (detected automatically).
5. Root Directory: `./` (leave default).
6. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: *(Your Supabase Project URL)*
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase anon public key)*
   - `SUPABASE_URL`: *(Your Supabase Project URL)*
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Your Supabase service role secret key)*
   - `GROQ_API_KEY`: *(Optional: Your Groq API key)*
7. Click **Deploy**! 🚀

---

## 💻 Local Development

1. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   GROQ_API_KEY=your-groq-key
   ```
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
