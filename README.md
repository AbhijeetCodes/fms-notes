# FMS Notes — MBA Executive Class Library

A free website for FMS Delhi MBA-Executive students to share and browse class notes, slides, and study materials organized by semester and course.

**Live at:** https://abhijeetcodes.github.io/fms-notes/

## Features

- Browse documents by semester and course (all 76 courses from the syllabus)
- Upload PDFs, PPTs, DOCs, XLS, JPG, PNG files (max 50MB)
- Share links/URLs alongside file uploads
- Tag-based organization and search
- Google sign-in required to upload
- Moderation: uploads are held for review before becoming public
- Admin panel with approve/reject workflow
- Mobile-friendly, works great from WhatsApp links

## Tech Stack

- **Frontend:** React + Vite, deployed to GitHub Pages
- **Backend:** Supabase free tier (Postgres + Auth + Edge Functions)
- **File Storage:** Google Drive (15 GB free, organized by course folder)
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

### Step 3: Set Up Google OAuth (for user sign-in)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Go to **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Authorized redirect URIs: add `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Supabase Auth

1. In Supabase dashboard, go to **Authentication → Providers**
2. Find **Google** and enable it
3. Paste the Client ID and Client Secret from Step 3
4. Under **Authentication → URL Configuration**, add your site URL:
   - Site URL: `https://<your-github-username>.github.io/fms-notes/`
   - Redirect URLs: add the same URL

### Step 5: Set Up Google Drive Storage

Files are stored in Google Drive (15 GB free, no credit card needed), organized automatically into per-course subfolders.

#### 5a — Create a Google Cloud project and enable Drive API
1. In [Google Cloud Console](https://console.cloud.google.com/), select your project
2. Go to **APIs & Services → Library** → search **Google Drive API** → **Enable**

#### 5b — Create a Drive folder
1. Go to [drive.google.com](https://drive.google.com) and create a folder (e.g. `FMS Notes`)
2. Note the folder ID from the URL: `https://drive.google.com/drive/folders/<FOLDER_ID>`

#### 5c — Get an OAuth2 refresh token
1. In Google Cloud Console → **APIs & Services → Credentials** → **Create Credentials → OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
4. Note the **Client ID** and **Client Secret**
5. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
6. Click the gear icon → check **Use your own OAuth credentials** → paste Client ID and Secret
7. In the left panel, select **Drive API v3** → `https://www.googleapis.com/auth/drive` → **Authorize APIs**
8. Sign in with the Google account that owns the Drive folder
9. Click **Exchange authorization code for tokens** → copy the **Refresh token**

#### 5d — Deploy the Edge Function
1. Install the Supabase CLI: `npm install -g supabase`
2. Log in: `npx supabase login`
3. Add secrets in Supabase dashboard → **Edge Functions → Manage secrets**:
   - `GOOGLE_CLIENT_ID` — from Step 5c
   - `GOOGLE_CLIENT_SECRET` — from Step 5c
   - `GOOGLE_REFRESH_TOKEN` — from Step 5c
   - `GOOGLE_DRIVE_FOLDER_ID` — from Step 5b
4. Deploy: `npx supabase functions deploy upload-to-drive`

### Step 6: Add GitHub Repo Variables

1. Go to your repo → **Settings → Secrets and variables → Actions → Variables tab**
2. Add two **repository variables** (NOT secrets):
   - `VITE_SUPABASE_URL` = your Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` = your anon key from Step 1
3. Go to **Actions** tab and re-run the deploy workflow

### Step 7: Add Moderators

1. In Supabase dashboard, go to **Table Editor → moderators**
2. Click **Insert Row**
3. Add your Gmail address (the one you'll sign in with)
4. Add any co-moderators' Gmail addresses

### Step 8: Test the Full Flow

1. Open your GitHub Pages URL
2. Click **Sign In** → sign in with Google
3. Go to **Upload** → pick a course, add a title, upload a small PDF
4. Open the site in an incognito window → the document should NOT appear (it's pending)
5. Sign back in → go to **Admin** → approve the document
6. Refresh incognito → the document should now appear and be downloadable
7. Check your Google Drive — the file should be in a subfolder named after the course code

---

## Migrating Existing Files to Google Drive

If you have files already uploaded (stored as `.zip` in Supabase Storage), run the migration script to move them to Drive:

```bash
cp .env.migration.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_* values
npm install googleapis dotenv
node scripts/migrate-to-drive.js
```

The script is safe to re-run — already-migrated files are skipped.

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
