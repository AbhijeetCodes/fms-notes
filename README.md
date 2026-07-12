# FMS Notes — MBA Executive Class Library

A free website for FMS Delhi MBA-Executive students to share and browse class notes, slides, and study materials organized by semester and course.

**Live at:** https://abhijeetcodes.github.io/class-notes/

## Features

- Browse documents by semester and course (all 76 courses from the syllabus)
- Upload PDFs, PPTs, DOCs, XLS files (max 15MB)
- Tag-based organization and search
- Google sign-in required to upload
- Moderation: uploads are held for review before becoming public
- Admin panel with storage meter and approve/reject workflow
- Mobile-friendly, works great from WhatsApp links

## Tech Stack

- **Frontend:** React + Vite, deployed to GitHub Pages
- **Backend:** Supabase free tier (Postgres + Storage + Auth)
- **Auth:** Google OAuth via Supabase
- **Security:** Row Level Security (RLS) — no backend server needed

---

## Setup Guide

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**
3. Pick a name (e.g. `fms-notes`), set a database password, choose a region close to India
4. Wait for the project to provision (~1 minute)
5. Once ready, go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefg.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 2: Run the SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**
3. Click **New Query** again, paste `supabase/seed_courses.sql`, and click **Run**
4. Verify: go to **Table Editor** — you should see `courses` (76 rows), `documents` (0 rows), `moderators` (0 rows)

### Step 3: Create the Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `documents`
4. **Public bucket: OFF** (keep private — RLS controls access)
5. File size limit: `15728640` (15MB in bytes)
6. Allowed MIME types (paste all):
   ```
   application/pdf
   application/vnd.ms-powerpoint
   application/vnd.openxmlformats-officedocument.presentationml.presentation
   application/msword
   application/vnd.openxmlformats-officedocument.wordprocessingml.document
   application/vnd.ms-excel
   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   ```

### Step 4: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 5: Configure Supabase Auth

1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and enable it
3. Paste the Client ID and Client Secret from Step 4
4. Under **Authentication → URL Configuration**, add your site URL:
   - Site URL: `https://abhijeetcodes.github.io/class-notes/`
   - Redirect URLs: add `https://abhijeetcodes.github.io/class-notes/`

### Step 6: Add GitHub Repo Variables

1. Go to your repo: https://github.com/AbhijeetCodes/class-notes
2. **Settings → Secrets and variables → Actions → Variables tab**
3. Add two **repository variables** (NOT secrets):
   - `VITE_SUPABASE_URL` = your Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` = your anon key from Step 1
4. Go to **Actions** tab, find the failed deploy workflow, and click **Re-run all jobs**

### Step 7: Add Moderators

1. In Supabase dashboard, go to **Table Editor → moderators**
2. Click **Insert Row**
3. Add your Gmail address (the one you'll sign in with)
4. Add any co-moderators' Gmail addresses

### Step 8: Test the Full Flow

1. Open https://abhijeetcodes.github.io/class-notes/
2. Click **Sign In** → sign in with Google
3. Go to **Upload** → pick a course, add a title, upload a small PDF
4. Open the site in an incognito window → the document should NOT appear (it's pending)
5. Sign back in → go to **Admin** → approve the document
6. Refresh incognito → the document should now appear and be downloadable

---

## Local Development

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key in .env
npm install
npm run dev
```

## How the Keepalive Works

Supabase free projects pause after ~7 days of inactivity. The `keepalive.yml` GitHub Action runs daily and pings your Supabase project to prevent this. It uses the same repo variables you set up in Step 6.
