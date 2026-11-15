# Bulk upload the supplied BCA Semester 3 SEP papers

This one-time importer uploads the six supplied PDFs into the existing private
`question-papers` Supabase bucket and creates matching `question_papers`
records. Every new record is created with `status = pending`; nothing is
published to students until an administrator approves it.

## 1. Prepare the files

At the repository root, create a folder named `bulk-papers` and put these
six files inside it, keeping their names unchanged:

- `SEP  BCA III Sem - Computer Networks.pdf`
- `SEP BCA III Sem  - Web Content Management System.pdf`
- `SEP BCA III Sem - C# & Dotnet Framework.pdf`
- `SEP BCA III Sem - Database Management System.pdf`
- `SEP BCA III Sem Enlish Language.pdf`
- `SEP BCA III Sem Hindi.pdf`

The script validates the exact filenames, PDF signatures, and the existing
10 MB per-file bucket limit. It does not put the PDFs in Git.

## 2. Set the admin credentials locally

In the project's existing `.env.local`, keep the two Supabase variables already
used by the app and add:

```env
CAMPUS_ARCHIVE_ADMIN_EMAIL=your-admin-email
CAMPUS_ARCHIVE_ADMIN_PASSWORD=your-admin-password
```

Use the email and password of an active, email-verified Campus Archive admin.
Do not commit `.env.local` or share these credentials.

## 3. Run the importer

From the project root in PowerShell:

```powershell
npm run bulk-upload:papers
```

The script signs in, verifies that the account is an active admin, finds the
BCA course and Semester 3, creates any missing subjects, and uploads the PDFs.
It checks SHA-256 hashes to avoid importing identical papers twice. If a
database insert fails after a file upload, it attempts to remove that uploaded
file so it does not leave an orphan.

## 4. Review in Campus Archive

Open the admin area and review the six new submissions. They remain pending
until you approve them.

## Paper details

All six papers are identified from their cover pages as Third Semester B.C.A.
SEP examinations, December 2025 / January 2026, for the 2025–2026 batch
onwards. The importer uses academic year `2025`, matching the app's existing
four-digit academic-year field.
