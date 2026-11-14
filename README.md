# Campus Archive

A college question-paper archive built with Next.js, TypeScript, Supabase Auth, PostgreSQL and private Supabase Storage.

## What's implemented

- Responsive homepage and approved-paper repository.
- Search across paper title, year and description.
- Paper detail page with time-limited signed PDF preview/download.
- Supabase email/password authentication and password recovery.
- College access-code registration flow with course restriction and usage limits.
- Student dashboard and private PDF upload workflow.
- Admin-only paper approval/rejection and invitation-code generation.
- SQL schema, Row Level Security policies, private storage bucket and seed catalog.
- `.env.example` and GitHub-safe `.gitignore`.

## Important setup

This repository is a functional MVP scaffold, not a hosted service. You must create and configure your own Supabase project. No credentials are included.

### 1. Requirements

Install Node.js 20.9+ and Git. Install Visual Studio Code.

### 2. Install

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
```

### 3. Create Supabase project

1. Create a project at https://supabase.com.
2. Open Project Settings → API and copy the Project URL and anon/public key.
3. Put them in `.env.local`.
4. Set `NEXT_PUBLIC_COLLEGE_NAME` and `NEXT_PUBLIC_APP_URL`.

Never put a Supabase service-role key in this app or in browser code.

### 4. Create database

In Supabase → SQL Editor, run `supabase/migrations/001_initial_schema.sql`, then run `supabase/seed.sql`.

The migration creates the private `question-papers` storage bucket, policies and schema. Review the SQL before applying it to a real college database.

### 5. Configure Supabase Auth

In Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Add redirect URL: `http://localhost:3000/reset-password`
- For production, add your Vercel URL and its `/reset-password` path.

Enable email confirmations. Supabase's default email sender has rate limits; configure SMTP for reliable real-world delivery. Do not promise students email delivery until this is configured and tested.

### 6. Create the first administrator securely

Registration always creates a `student` role. Never promote yourself by changing client-side metadata.

After registering and verifying your own account, use the Supabase SQL Editor while signed in as the project owner to promote the intended account:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
);
```

Replace the email with your own verified admin email. Run this once, then protect access to the Supabase project owner account with MFA.

### 7. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

### 8. Deploy

1. Push this project to a private GitHub repository if it contains institution-specific configuration.
2. Import the repository into Vercel.
3. Add the same environment variables in Vercel Project Settings.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS URL.
5. Add the production URL and `/reset-password` to Supabase Auth redirect URLs.
6. Deploy and test registration, email verification, password recovery, uploads, approvals and private file access.

## Registration access code design

The database stores only SHA-256 hashes of access codes. The raw code is shown once to the administrator. Redemption uses a single atomic database update, checks expiry, active status, usage limit and optional course restriction. Email verification remains a separate requirement. Access codes never create admin accounts.

## Roles and publishing rules

- Guest: browse approved papers only.
- Student: after email verification and account activation, upload papers and manage their own workspace.
- Admin: approve/reject papers and create registration codes.
- Every paper starts as `pending`. Pending PDFs are private in Storage.
- Account activation and paper approval are separate workflows.

## Before real college launch

This MVP still needs a security and operational review. In particular:
- Add stronger server-side validation that selected course, semester and subject relationships are consistent.
- Add rate limiting to registration and access-code redemption at the edge or through a trusted server-side service.
- Review Supabase RLS and Storage policies with a security reviewer.
- Add audit logging for admin decisions, code revocation/expiry management and admin account lifecycle.
- Add robust PDF parsing/malware scanning, file hashing and duplicate detection.
- Add pagination, full-text/tag search, reporting and bookmarks UI.
- Add admin catalog management for courses, semesters and subjects.
- Add automated tests and run `npm run typecheck`, `npm run lint` and `npm run build` after configuring dependencies.
- Configure SMTP and verify email delivery.
- Check college permission and copyright rules before publishing question papers.

Free tiers have quotas and policies that can change. Storage, bandwidth and email delivery are not unlimited or guaranteed free.

## Project structure

```text
app/
  admin/
  dashboard/
  forgot-password/
  login/
  papers/
  register/
  reset-password/
  upload/
lib/supabase/
supabase/
  migrations/
  seed.sql
```
